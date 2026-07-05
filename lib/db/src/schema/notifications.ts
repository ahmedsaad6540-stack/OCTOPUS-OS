import { pgTable, text, timestamp, uuid, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * A configured notification channel: which channel type (`in_app`,
 * `webhook`, or a custom type registered via `NotificationManager.
 * registerChannel()`) and its channel-specific settings (e.g.
 * `{ webhookUrl }`).
 */
export const notificationChannelsTable = pgTable(
  "notification_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    channelType: text("channel_type").notNull(),
    config: jsonb("config").notNull().default({}),
    status: text("status").notNull().default("active"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("notification_channels_channel_type_idx").on(table.channelType),
    index("notification_channels_status_idx").on(table.status),
    index("notification_channels_user_id_idx").on(table.userId),
  ],
);

export type NotificationChannelRecord = typeof notificationChannelsTable.$inferSelect;
export type InsertNotificationChannelRecord = typeof notificationChannelsTable.$inferInsert;

/**
 * Durable record of one delivery attempt through one channel. For the
 * `in_app` channel type, this table doubles as the recipient's inbox —
 * there's no separate "notifications" table, since the delivery record
 * already has everything an inbox entry needs (`recipientUserId`,
 * `title`/`body`/`data`, `read`).
 */
export const notificationDeliveriesTable = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelConfigId: uuid("channel_config_id")
      .notNull()
      .references(() => notificationChannelsTable.id, { onDelete: "cascade" }),
    channelType: text("channel_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data"),
    recipientUserId: uuid("recipient_user_id").references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    error: text("error"),
    read: boolean("read").notNull().default(false),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (table) => [
    index("notification_deliveries_channel_config_id_idx").on(table.channelConfigId),
    index("notification_deliveries_recipient_user_id_idx").on(table.recipientUserId),
    index("notification_deliveries_status_idx").on(table.status),
    index("notification_deliveries_read_idx").on(table.read),
    index("notification_deliveries_sent_at_idx").on(table.sentAt),
  ],
);

export type NotificationDeliveryRecord = typeof notificationDeliveriesTable.$inferSelect;
export type InsertNotificationDeliveryRecord = typeof notificationDeliveriesTable.$inferInsert;
