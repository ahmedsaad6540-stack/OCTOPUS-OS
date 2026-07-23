import { randomUUID } from "node:crypto";
import { createInAppChannel, createWebhookChannel } from "./channels.js";
import type {
  CreateNotificationChannelInput,
  EventSubscriber,
  NotificationChannelConfig,
  NotificationChannelFactory,
  NotificationChannelListQuery,
  NotificationChannelStore,
  NotificationDelivery,
  NotificationDeliveryListQuery,
  NotificationDeliveryStore,
  NotificationMessage,
  NotificationSystemLogger,
  UpdateNotificationChannelInput,
} from "./types.js";

const noopLogger: NotificationSystemLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const builtInFactories: Record<string, NotificationChannelFactory> = {
  in_app: () => createInAppChannel(),
  webhook: () => createWebhookChannel(),
};

/** Thrown by `send()` when no channel config with that id exists. */
export class NotificationChannelNotFoundError extends Error {
  constructor(id: string) {
    super(`Notification channel config "${id}" does not exist`);
    this.name = "NotificationChannelNotFoundError";
  }
}

/** Thrown by `send()` when the channel config exists but is disabled. */
export class NotificationChannelDisabledError extends Error {
  constructor(id: string) {
    super(`Notification channel config "${id}" is disabled`);
    this.name = "NotificationChannelDisabledError";
  }
}

/** Thrown by `send()` when the config's `channelType` has no registered factory. */
export class UnknownNotificationChannelTypeError extends Error {
  constructor(channelType: string) {
    super(`No notification channel factory registered for "${channelType}"`);
    this.name = "UnknownNotificationChannelTypeError";
  }
}

const NOTIFICATION_REQUESTED_EVENT = "notification.requested";

interface NotificationRequestedPayload {
  channelConfigId: string;
  message: NotificationMessage;
  recipientUserId?: string;
}

function isNotificationRequestedPayload(value: unknown): value is NotificationRequestedPayload {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v["channelConfigId"] !== "string") return false;
  const message = v["message"];
  if (message === null || typeof message !== "object") return false;
  const m = message as Record<string, unknown>;
  return typeof m["title"] === "string" && typeof m["body"] === "string";
}

/**
 * Channel configuration and delivery for the whole system. `send()` always
 * records a `NotificationDelivery` once a channel is actually resolved and
 * invoked — `sent` or `failed` — never silently drops an attempt. Ships
 * `in_app` (the delivery record itself is the inbox) and `webhook` (a real
 * HTTP POST) out of the box; anything else registers via
 * `registerChannel()`.
 */
export class NotificationManager {
  private readonly factories = new Map<string, NotificationChannelFactory>(Object.entries(builtInFactories));
  private unsubscribeEventTrigger: (() => void) | null = null;

  constructor(
    private readonly channelStore: NotificationChannelStore,
    private readonly deliveryStore: NotificationDeliveryStore,
    private readonly eventSubscriber?: EventSubscriber,
    private readonly logger: NotificationSystemLogger = noopLogger,
  ) {
    if (this.eventSubscriber) {
      this.unsubscribeEventTrigger = this.eventSubscriber.subscribe(
        NOTIFICATION_REQUESTED_EVENT,
        "notification-system:dispatch",
        (event) => this.handleNotificationRequested(event.payload),
      );
    }
  }

  /** Registers (or replaces) the channel factory for a channel type. */
  registerChannel(channelType: string, factory: NotificationChannelFactory): void {
    this.factories.set(channelType, factory);
  }

  /** Stops listening for `notification.requested` events. Safe to call even if no `EventSubscriber` was configured. */
  stopEventTrigger(): void {
    this.unsubscribeEventTrigger?.();
    this.unsubscribeEventTrigger = null;
  }

  async createChannel(input: CreateNotificationChannelInput): Promise<NotificationChannelConfig> {
    const now = new Date().toISOString();
    const channel: NotificationChannelConfig = {
      id: randomUUID(),
      name: input.name,
      channelType: input.channelType,
      config: input.config,
      status: input.status ?? "active",
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    return this.channelStore.insert(channel);
  }

  async updateChannel(id: string, input: UpdateNotificationChannelInput): Promise<NotificationChannelConfig | null> {
    const existing = await this.channelStore.getById(id);
    if (!existing) return null;

    const updated: NotificationChannelConfig = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.channelType !== undefined ? { channelType: input.channelType } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    return this.channelStore.update(id, updated);
  }

  async deleteChannel(id: string): Promise<boolean> {
    return this.channelStore.delete(id);
  }

  async getChannel(id: string): Promise<NotificationChannelConfig | null> {
    return this.channelStore.getById(id);
  }

  async listChannels(query: NotificationChannelListQuery = {}): Promise<NotificationChannelConfig[]> {
    return this.channelStore.list(query);
  }

  /**
   * Sends `message` through the named channel config, always recording a
   * `NotificationDelivery` once the channel is actually invoked. Throws
   * `NotificationChannelNotFoundError`, `NotificationChannelDisabledError`,
   * or `UnknownNotificationChannelTypeError` before that point — none of
   * those produce a delivery record, since nothing was attempted.
   */
  async send(channelConfigId: string, message: NotificationMessage, recipientUserId?: string): Promise<NotificationDelivery> {
    const channelConfig = await this.channelStore.getById(channelConfigId);
    if (!channelConfig) throw new NotificationChannelNotFoundError(channelConfigId);
    if (channelConfig.status !== "active") throw new NotificationChannelDisabledError(channelConfigId);

    const factory = this.factories.get(channelConfig.channelType);
    if (!factory) throw new UnknownNotificationChannelTypeError(channelConfig.channelType);
    const channel = factory(channelConfig);

    let status: "sent" | "failed";
    let error: string | null = null;
    try {
      await channel.send(message, channelConfig.config, recipientUserId);
      status = "sent";
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
    }

    const delivery: NotificationDelivery = {
      id: randomUUID(),
      channelConfigId,
      channelType: channelConfig.channelType,
      message,
      ...(recipientUserId ? { recipientUserId } : {}),
      status,
      error,
      read: false,
      sentAt: new Date().toISOString(),
    };
    const stored = await this.deliveryStore.insert(delivery);

    if (status === "failed") {
      this.logger.error({ deliveryId: stored.id, channelConfigId, error }, "notification_system.send_failed");
    } else {
      this.logger.info({ deliveryId: stored.id, channelConfigId }, "notification_system.sent");
    }

    return stored;
  }

  async getDelivery(id: string): Promise<NotificationDelivery | null> {
    return this.deliveryStore.getById(id);
  }

  async listDeliveries(query: NotificationDeliveryListQuery = {}): Promise<NotificationDelivery[]> {
    return this.deliveryStore.list(query);
  }

  /** Marks a delivery read — the in-app inbox's only mutation. Returns `null` if the delivery doesn't exist. */
  async markRead(id: string): Promise<NotificationDelivery | null> {
    const existing = await this.deliveryStore.getById(id);
    if (!existing) return null;
    return this.deliveryStore.update(id, { ...existing, read: true });
  }

  private async handleNotificationRequested(payload: unknown): Promise<void> {
    if (!isNotificationRequestedPayload(payload)) {
      this.logger.warn({ payload }, "notification_system.malformed_request_event");
      return;
    }
    try {
      await this.send(payload.channelConfigId, payload.message, payload.recipientUserId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ error: message }, "notification_system.event_triggered_send_failed");
    }
  }
}
