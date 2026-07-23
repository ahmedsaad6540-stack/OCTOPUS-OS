import type {
  NotificationChannelConfig,
  NotificationChannelListQuery,
  NotificationChannelStore,
  NotificationDelivery,
  NotificationDeliveryListQuery,
  NotificationDeliveryStore,
} from "./types.js";

/** In-memory notification channel store for unit tests and local scripts. The api-server always wires up `DrizzleNotificationChannelStore`. */
export class InMemoryNotificationChannelStore implements NotificationChannelStore {
  private readonly channels = new Map<string, NotificationChannelConfig>();

  async insert(channel: NotificationChannelConfig): Promise<NotificationChannelConfig> {
    this.channels.set(channel.id, { ...channel });
    return { ...channel };
  }

  async update(id: string, channel: NotificationChannelConfig): Promise<NotificationChannelConfig | null> {
    if (!this.channels.has(id)) return null;
    this.channels.set(id, { ...channel });
    return { ...channel };
  }

  async delete(id: string): Promise<boolean> {
    return this.channels.delete(id);
  }

  async getById(id: string): Promise<NotificationChannelConfig | null> {
    const channel = this.channels.get(id);
    return channel ? { ...channel } : null;
  }

  async list(query: NotificationChannelListQuery): Promise<NotificationChannelConfig[]> {
    let results = Array.from(this.channels.values());
    if (query.channelType) results = results.filter((c) => c.channelType === query.channelType);
    if (query.status) results = results.filter((c) => c.status === query.status);
    if (query.userId) results = results.filter((c) => c.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((c) => ({ ...c }));
  }
}

/** In-memory notification delivery store for unit tests and local scripts. The api-server always wires up `DrizzleNotificationDeliveryStore`. */
export class InMemoryNotificationDeliveryStore implements NotificationDeliveryStore {
  private readonly deliveries = new Map<string, NotificationDelivery>();

  async insert(delivery: NotificationDelivery): Promise<NotificationDelivery> {
    this.deliveries.set(delivery.id, { ...delivery });
    return { ...delivery };
  }

  async update(id: string, delivery: NotificationDelivery): Promise<NotificationDelivery | null> {
    if (!this.deliveries.has(id)) return null;
    this.deliveries.set(id, { ...delivery });
    return { ...delivery };
  }

  async getById(id: string): Promise<NotificationDelivery | null> {
    const delivery = this.deliveries.get(id);
    return delivery ? { ...delivery } : null;
  }

  async list(query: NotificationDeliveryListQuery): Promise<NotificationDelivery[]> {
    let results = Array.from(this.deliveries.values());
    if (query.channelConfigId) results = results.filter((d) => d.channelConfigId === query.channelConfigId);
    if (query.recipientUserId) results = results.filter((d) => d.recipientUserId === query.recipientUserId);
    if (query.status) results = results.filter((d) => d.status === query.status);
    if (query.read !== undefined) results = results.filter((d) => d.read === query.read);
    results.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((d) => ({ ...d }));
  }
}
