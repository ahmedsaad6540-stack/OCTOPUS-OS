import { and, desc, eq } from "drizzle-orm";
import {
  notificationChannelsTable,
  notificationDeliveriesTable,
  type NotificationChannelRecord,
  type NotificationDeliveryRecord,
} from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  NotificationChannelConfig,
  NotificationChannelListQuery,
  NotificationChannelStatus,
  NotificationChannelStore,
  NotificationDelivery,
  NotificationDeliveryListQuery,
  NotificationDeliveryStatus,
  NotificationDeliveryStore,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toChannel(record: NotificationChannelRecord): NotificationChannelConfig {
  return {
    id: record.id,
    name: record.name,
    channelType: record.channelType,
    config: record.config,
    status: record.status as NotificationChannelStatus,
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleNotificationChannelStore implements NotificationChannelStore {
  constructor(private readonly db: Db) {}

  async insert(channel: NotificationChannelConfig): Promise<NotificationChannelConfig> {
    await this.db.insert(notificationChannelsTable).values({
      id: channel.id,
      name: channel.name,
      channelType: channel.channelType,
      config: channel.config,
      status: channel.status,
      userId: channel.userId ?? null,
      createdAt: new Date(channel.createdAt),
      updatedAt: new Date(channel.updatedAt),
    });
    return channel;
  }

  async update(id: string, channel: NotificationChannelConfig): Promise<NotificationChannelConfig | null> {
    const rows = await this.db
      .update(notificationChannelsTable)
      .set({
        name: channel.name,
        channelType: channel.channelType,
        config: channel.config,
        status: channel.status,
        updatedAt: new Date(channel.updatedAt),
      })
      .where(eq(notificationChannelsTable.id, id))
      .returning();
    return rows[0] ? toChannel(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(notificationChannelsTable).where(eq(notificationChannelsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<NotificationChannelConfig | null> {
    const rows = await this.db.select().from(notificationChannelsTable).where(eq(notificationChannelsTable.id, id)).limit(1);
    return rows[0] ? toChannel(rows[0]) : null;
  }

  async list(query: NotificationChannelListQuery): Promise<NotificationChannelConfig[]> {
    const conditions = [];
    if (query.channelType) conditions.push(eq(notificationChannelsTable.channelType, query.channelType));
    if (query.status) conditions.push(eq(notificationChannelsTable.status, query.status));
    if (query.userId) conditions.push(eq(notificationChannelsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(notificationChannelsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notificationChannelsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toChannel);
  }
}

function toDelivery(record: NotificationDeliveryRecord): NotificationDelivery {
  return {
    id: record.id,
    channelConfigId: record.channelConfigId,
    channelType: record.channelType,
    message: { title: record.title, body: record.body, ...(record.data !== null ? { data: record.data } : {}) },
    ...(record.recipientUserId ? { recipientUserId: record.recipientUserId } : {}),
    status: record.status as NotificationDeliveryStatus,
    error: record.error,
    read: record.read,
    sentAt: record.sentAt.toISOString(),
  };
}

export class DrizzleNotificationDeliveryStore implements NotificationDeliveryStore {
  constructor(private readonly db: Db) {}

  async insert(delivery: NotificationDelivery): Promise<NotificationDelivery> {
    await this.db.insert(notificationDeliveriesTable).values({
      id: delivery.id,
      channelConfigId: delivery.channelConfigId,
      channelType: delivery.channelType,
      title: delivery.message.title,
      body: delivery.message.body,
      data: delivery.message.data ?? null,
      recipientUserId: delivery.recipientUserId ?? null,
      status: delivery.status,
      error: delivery.error,
      read: delivery.read,
      sentAt: new Date(delivery.sentAt),
    });
    return delivery;
  }

  async update(id: string, delivery: NotificationDelivery): Promise<NotificationDelivery | null> {
    const rows = await this.db
      .update(notificationDeliveriesTable)
      .set({ read: delivery.read })
      .where(eq(notificationDeliveriesTable.id, id))
      .returning();
    return rows[0] ? toDelivery(rows[0]) : null;
  }

  async getById(id: string): Promise<NotificationDelivery | null> {
    const rows = await this.db.select().from(notificationDeliveriesTable).where(eq(notificationDeliveriesTable.id, id)).limit(1);
    return rows[0] ? toDelivery(rows[0]) : null;
  }

  async list(query: NotificationDeliveryListQuery): Promise<NotificationDelivery[]> {
    const conditions = [];
    if (query.channelConfigId) conditions.push(eq(notificationDeliveriesTable.channelConfigId, query.channelConfigId));
    if (query.recipientUserId) conditions.push(eq(notificationDeliveriesTable.recipientUserId, query.recipientUserId));
    if (query.status) conditions.push(eq(notificationDeliveriesTable.status, query.status));
    if (query.read !== undefined) conditions.push(eq(notificationDeliveriesTable.read, query.read));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(notificationDeliveriesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notificationDeliveriesTable.sentAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toDelivery);
  }
}
