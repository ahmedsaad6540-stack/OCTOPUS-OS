import type { AuditEntry, AuditLogQuery, AuditLogStore } from "./types.js";

/** In-memory audit log store for unit tests and local scripts. The api-server always wires up `DrizzleAuditLogStore`. */
export class InMemoryAuditLogStore implements AuditLogStore {
  private readonly entries = new Map<string, AuditEntry>();

  async insert(entry: AuditEntry): Promise<AuditEntry> {
    this.entries.set(entry.id, { ...entry });
    return { ...entry };
  }

  async getById(id: string): Promise<AuditEntry | null> {
    const entry = this.entries.get(id);
    return entry ? { ...entry } : null;
  }

  async list(query: AuditLogQuery): Promise<AuditEntry[]> {
    let results = Array.from(this.entries.values());
    if (query.action) results = results.filter((e) => e.action === query.action);
    if (query.resourceType) results = results.filter((e) => e.resourceType === query.resourceType);
    if (query.resourceId) results = results.filter((e) => e.resourceId === query.resourceId);
    if (query.actorUserId) results = results.filter((e) => e.actorUserId === query.actorUserId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 1000)).map((e) => ({ ...e }));
  }
}
