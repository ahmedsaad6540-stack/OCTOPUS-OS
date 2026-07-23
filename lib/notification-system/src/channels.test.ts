import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createInAppChannel, createWebhookChannel } from "./channels.js";
import type { FetchLike } from "./channels.js";

describe("createInAppChannel", () => {
  test("send() resolves without doing anything observable", async () => {
    const channel = createInAppChannel();
    await assert.doesNotReject(() => channel.send({ title: "t", body: "b" }, {}));
  });
});

describe("createWebhookChannel", () => {
  test("posts the message as JSON to config.webhookUrl", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const fakeFetch: FetchLike = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return { ok: true, status: 200, async text() { return ""; } };
    };

    const channel = createWebhookChannel(fakeFetch);
    await channel.send({ title: "Alert", body: "Something happened", data: { severity: "high" } }, { webhookUrl: "https://hooks.example.com/x" });

    assert.equal(capturedUrl, "https://hooks.example.com/x");
    assert.equal(capturedInit?.method, "POST");
    assert.equal((capturedInit!.headers as Record<string, string>)["content-type"], "application/json");
    assert.deepEqual(JSON.parse(capturedInit!.body as string), {
      title: "Alert",
      body: "Something happened",
      data: { severity: "high" },
    });
  });

  test("throws when config is missing webhookUrl", async () => {
    const channel = createWebhookChannel(async () => ({ ok: true, status: 200, async text() { return ""; } }));
    await assert.rejects(() => channel.send({ title: "t", body: "b" }, {}), /webhookUrl/);
  });

  test("throws with the response body when the webhook call fails", async () => {
    const fakeFetch: FetchLike = async () => ({ ok: false, status: 500, async text() { return "server error"; } });
    const channel = createWebhookChannel(fakeFetch);
    await assert.rejects(
      () => channel.send({ title: "t", body: "b" }, { webhookUrl: "https://hooks.example.com/x" }),
      /Webhook delivery failed \(500\): server error/,
    );
  });
});
