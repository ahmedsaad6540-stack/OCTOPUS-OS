import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  NotificationManager,
  NotificationChannelNotFoundError,
  NotificationChannelDisabledError,
  UnknownNotificationChannelTypeError,
} from "./notification-manager.js";
import { InMemoryNotificationChannelStore, InMemoryNotificationDeliveryStore } from "./in-memory-store.js";
import type { EventSubscriber, NotificationEvent, Unsubscribe } from "./types.js";

function createTestBus() {
  const subscriptions: Array<{ pattern: string; handler: (event: NotificationEvent) => Promise<void> | void }> = [];
  const bus: EventSubscriber = {
    subscribe(pattern, _handlerName, handler): Unsubscribe {
      const entry = { pattern, handler: handler as (event: NotificationEvent) => Promise<void> | void };
      subscriptions.push(entry);
      return () => {
        const idx = subscriptions.indexOf(entry);
        if (idx >= 0) subscriptions.splice(idx, 1);
      };
    },
  };
  async function emit(type: string, payload: unknown): Promise<void> {
    for (const sub of [...subscriptions]) {
      if (sub.pattern === type || sub.pattern === "*") {
        await sub.handler({ id: "evt-1", type, payload });
      }
    }
  }
  return { bus, emit, subscriptionCount: () => subscriptions.length };
}

describe("NotificationManager — channel CRUD", () => {
  test("createChannel() defaults status to active", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {} });
    assert.equal(channel.status, "active");
  });

  test("updateChannel()/deleteChannel() work", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {} });
    const updated = await manager.updateChannel(channel.id, { name: "renamed" });
    assert.equal(updated?.name, "renamed");
    assert.equal(await manager.deleteChannel(channel.id), true);
    assert.equal(await manager.getChannel(channel.id), null);
  });
});

describe("NotificationManager — send()", () => {
  test("throws NotificationChannelNotFoundError for a nonexistent channel", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    await assert.rejects(() => manager.send("does-not-exist", { title: "t", body: "b" }), NotificationChannelNotFoundError);
  });

  test("throws NotificationChannelDisabledError for a disabled channel", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {}, status: "disabled" });
    await assert.rejects(() => manager.send(channel.id, { title: "t", body: "b" }), NotificationChannelDisabledError);
  });

  test("throws UnknownNotificationChannelTypeError for an unregistered channel type", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    const channel = await manager.createChannel({ name: "x", channelType: "made-up", config: {} });
    await assert.rejects(() => manager.send(channel.id, { title: "t", body: "b" }), UnknownNotificationChannelTypeError);
  });

  test("in_app send() records a delivery that becomes the recipient's inbox entry", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {} });

    const delivery = await manager.send(channel.id, { title: "Welcome", body: "Hello!" }, "user-1");
    assert.equal(delivery.status, "sent");
    assert.equal(delivery.recipientUserId, "user-1");
    assert.equal(delivery.read, false);

    const inbox = await manager.listDeliveries({ recipientUserId: "user-1" });
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0]?.message.title, "Welcome");
  });

  test("a custom registered channel that throws records a failed delivery", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    manager.registerChannel("flaky", () => ({
      async send() {
        throw new Error("channel exploded");
      },
    }));
    const channel = await manager.createChannel({ name: "x", channelType: "flaky", config: {} });

    const delivery = await manager.send(channel.id, { title: "t", body: "b" });
    assert.equal(delivery.status, "failed");
    assert.equal(delivery.error, "channel exploded");
  });

  test("markRead() flips the read flag; returns null for a nonexistent delivery", async () => {
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore());
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {} });
    const delivery = await manager.send(channel.id, { title: "t", body: "b" }, "user-1");

    const marked = await manager.markRead(delivery.id);
    assert.equal(marked?.read, true);
    assert.equal(await manager.markRead("does-not-exist"), null);
  });
});

describe("NotificationManager — Event Bus trigger", () => {
  test("a notification.requested event triggers a send", async () => {
    const { bus, emit } = createTestBus();
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore(), bus);
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {} });

    await emit("notification.requested", {
      channelConfigId: channel.id,
      message: { title: "Triggered", body: "via event" },
      recipientUserId: "user-2",
    });

    const inbox = await manager.listDeliveries({ recipientUserId: "user-2" });
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0]?.message.title, "Triggered");
  });

  test("a malformed notification.requested payload is ignored, not thrown", async () => {
    const { bus, emit } = createTestBus();
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore(), bus);
    await assert.doesNotReject(() => emit("notification.requested", { garbage: true }));
  });

  test("stopEventTrigger() unsubscribes; subsequent events are ignored", async () => {
    const { bus, emit, subscriptionCount } = createTestBus();
    const manager = new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore(), bus);
    const channel = await manager.createChannel({ name: "inbox", channelType: "in_app", config: {} });
    assert.equal(subscriptionCount(), 1);

    manager.stopEventTrigger();
    assert.equal(subscriptionCount(), 0);

    await emit("notification.requested", { channelConfigId: channel.id, message: { title: "t", body: "b" } });
    assert.equal((await manager.listDeliveries({})).length, 0);
  });

  test("works with no EventSubscriber configured at all", () => {
    assert.doesNotThrow(() => new NotificationManager(new InMemoryNotificationChannelStore(), new InMemoryNotificationDeliveryStore()));
  });
});
