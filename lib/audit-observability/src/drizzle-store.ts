import { and, desc, eq } from "drizzle-orm";
import { auditLogTable, type AuditLogRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AuditEntry, AuditLogQuery, AuditLogStore } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toEntry(record: AuditLogRecord): AuditEntry {
  return {
    id: record.id,
    action: record.action,
    resourceType: record.resourceType,
    ...(record.resourceId ? { resourceId: record.resourceId } : {}),
    ...(record.actorUserId ? { actorUserId: record.actorUserId } : {}),
    ...(record.actorRole ? { actorRole: record.actorRole } : {}),
    ...(record.ipAddress ? { ipAddress: record.ipAddress } : {}),
    ...(record.metadata !== null ? { metadata: record.metadata } : {}),
    createdAt: record.createdAt.toISOString(),
  };
}

export class DrizzleAuditLogStore implements AuditLogStore {
  constructor(private readonly db: Db) {}

  async insert(entry: AuditEntry): Promise<AuditEntry> {
    await this.db.insert(auditLogTable).values({
      id: entry.id,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole ?? null,
      ipAddress: entry.ipAddress ?? null,
      metadata: entry.metadata ?? null,
      createdAt: new Date(entry.createdAt),
    });
    return entry;
  }

  async getById(id: string): Promise<AuditEntry | null> {
    const rows = await this.db.select().from(auditLogTable).where(eq(auditLogTable.id, id)).limit(1);
    return rows[0] ? toEntry(rows[0]) : null;
  }

  async list(query: AuditLogQuery): Promise<AuditEntry[]> {
    const conditions = [];
    if (query.action) conditions.push(eq(auditLogTable.action, query.action));
    if (query.resourceType) conditions.push(eq(auditLogTable.resourceType, query.resourceType));
    if (query.resourceId) conditions.push(eq(auditLogTable.resourceId, query.resourceId));
    if (query.actorUserId) conditions.push(eq(auditLogTable.actorUserId, query.actorUserId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(auditLogTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 1000));

    return rows.map(toEntry);
  }
}
