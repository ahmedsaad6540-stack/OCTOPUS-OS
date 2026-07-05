/**
 * The Notification System delivers a message through a configured channel
 * and durably records every attempt — the delivery record IS the in-app
 * inbox (`recipientUserId` + `read`), not a separate table, since "was
 * this delivered" and "what does the user see in their inbox" are the same
 * fact for the one channel that ships built in. `webhook` is the other
 * built-in channel: a real HTTP POST, injectable `fetch` for testability,
 * the production path performs a genuine call. Additional channels (email,
 * SMS, Slack...) register via `registerChannel()` without touching
 * existing configs or callers — no credentials for any of those are
 * available in this environment, so none are shipped rather than faked.
 *
 * Optionally subscribes to the Event Bus (decoupled — `EventSubscriber`
 * mirrors `EventBus.subscribe` exactly, same pattern as `Brain`) for a
 * `"notification.requested"` event type, so any other module can trigger a
 * notification just by publishing an event, with no direct dependency on
 * this package.
 */

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface NotificationMessage {
  title: string;
  body: string;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Channel configuration (durable)
// ---------------------------------------------------------------------------

export type NotificationChannelStatus = "active" | "disabled";

export const builtInNotificationChannelTypes = ["in_app", "webhook"] as const;
export type BuiltInNotificationChannelType = (typeof builtInNotificationChannelTypes)[number];

export interface NotificationChannelConfig {
  id: string;
  name: string;
  /** One of `builtInNotificationChannelTypes`, or a custom type registered via `registerChannel()`. */
  channelType: string;
  /** Channel-specific settings — e.g. `{ webhookUrl: string }` for `webhook`. Ignored by `in_app`. */
  config: unknown;
  status: NotificationChannelStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationChannelInput {
  name: string;
  channelType: string;
  config: unknown;
  status?: NotificationChannelStatus;
  userId?: string;
}

export type UpdateNotificationChannelInput = Partial<Omit<CreateNotificationChannelInput, "userId">>;

export interface NotificationChannelListQuery {
  channelType?: string;
  status?: NotificationChannelStatus;
  userId?: string;
  limit?: number;
}

export interface NotificationChannelStore {
  insert(channel: NotificationChannelConfig): Promise<NotificationChannelConfig>;
  update(id: string, channel: NotificationChannelConfig): Promise<NotificationChannelConfig | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<NotificationChannelConfig | null>;
  list(query: NotificationChannelListQuery): Promise<NotificationChannelConfig[]>;
}

// ---------------------------------------------------------------------------
// Deliveries (durable record — also the in-app inbox)
// ---------------------------------------------------------------------------

export type NotificationDeliveryStatus = "sent" | "failed";

export interface NotificationDelivery {
  id: string;
  channelConfigId: string;
  channelType: string;
  message: NotificationMessage;
  recipientUserId?: string;
  status: NotificationDeliveryStatus;
  error: string | null;
  read: boolean;
  sentAt: string;
}

export interface NotificationDeliveryListQuery {
  channelConfigId?: string;
  recipientUserId?: string;
  status?: NotificationDeliveryStatus;
  read?: boolean;
  limit?: number;
}

export interface NotificationDeliveryStore {
  insert(delivery: NotificationDelivery): Promise<NotificationDelivery>;
  update(id: string, delivery: NotificationDelivery): Promise<NotificationDelivery | null>;
  getById(id: string): Promise<NotificationDelivery | null>;
  list(query: NotificationDeliveryListQuery): Promise<NotificationDelivery[]>;
}

// ---------------------------------------------------------------------------
// Channels (extension point)
// ---------------------------------------------------------------------------

/** Must throw on failure rather than returning a sentinel — `NotificationManager.send()` treats any thrown error as the delivery failing. */
export interface NotificationChannel {
  send(message: NotificationMessage, config: unknown, recipientUserId?: string): Promise<void>;
}

export type NotificationChannelFactory = (channelConfig: NotificationChannelConfig) => NotificationChannel;

// ---------------------------------------------------------------------------
// Event Bus interop (decoupled — see file doc comment)
// ---------------------------------------------------------------------------

export interface NotificationEvent<TPayload = unknown> {
  id: string;
  type: string;
  payload: TPayload;
}

export type Unsubscribe = () => void;

export interface EventSubscriber {
  subscribe<TPayload = unknown>(
    pattern: string,
    handlerName: string,
    handler: (event: NotificationEvent<TPayload>) => Promise<void> | void,
  ): Unsubscribe;
}

export interface NotificationSystemLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
