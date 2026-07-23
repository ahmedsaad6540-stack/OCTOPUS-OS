import type { NotificationChannel, NotificationMessage } from "./types.js";

/**
 * The `in_app` channel does nothing beyond what `NotificationManager.send()`
 * already does for every channel: record a `NotificationDelivery`. That
 * record — `recipientUserId` + `message` + `read` — is the in-app inbox;
 * there's no separate "actually deliver it" step for a notification that
 * lives entirely inside this system.
 */
export function createInAppChannel(): NotificationChannel {
  return {
    async send(): Promise<void> {
      // Intentionally empty — see file doc comment.
    },
  };
}

export type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export interface WebhookChannelConfig {
  webhookUrl: string;
}

function isWebhookChannelConfig(value: unknown): value is WebhookChannelConfig {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>)["webhookUrl"] === "string"
  );
}

/**
 * Posts `{ title, body, data }` as JSON to `config.webhookUrl` — generic
 * enough for Slack incoming webhooks, Discord webhooks, or any custom
 * endpoint expecting a JSON payload. `fetch` is injected (defaulting to
 * the runtime global) purely so the request can be verified in tests
 * without a live network call; the production path performs a genuine
 * HTTP POST.
 */
export function createWebhookChannel(fetchFn: FetchLike = fetch): NotificationChannel {
  return {
    async send(message: NotificationMessage, config: unknown): Promise<void> {
      if (!isWebhookChannelConfig(config)) {
        throw new Error('Webhook channel config must include a "webhookUrl" string');
      }
      const response = await fetchFn(config.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: message.title, body: message.body, data: message.data ?? null }),
      });
      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Webhook delivery failed (${response.status}): ${bodyText}`);
      }
    },
  };
}
