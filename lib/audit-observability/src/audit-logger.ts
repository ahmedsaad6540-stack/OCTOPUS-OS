import { randomUUID } from "node:crypto";
import type { AuditEntry, AuditLogQuery, AuditLogStore, AuditObservabilityLogger, CreateAuditEntryInput } from "./types.js";

const noopLogger: AuditObservabilityLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Append-only audit trail. `record()` never throws on a storage failure by
 * itself propagating — it logs and re-throws, since a caller (the audit
 * middleware) needs to know if a write was actually durable, but it also
 * never blocks or fails the request it's auditing: the middleware calls
 * this fire-and-forget after the response has already been sent.
 */
export class AuditLogger {
  constructor(
    private readonly store: AuditLogStore,
    private readonly logger: AuditObservabilityLogger = noopLogger,
  ) {}

  async record(input: CreateAuditEntryInput): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: randomUUID(),
      action: input.action,
      resourceType: input.resourceType,
      ...(input.resourceId !== undefined ? { resourceId: input.resourceId } : {}),
      ...(input.actorUserId !== undefined ? { actorUserId: input.actorUserId } : {}),
      ...(input.actorRole !== undefined ? { actorRole: input.actorRole } : {}),
      ...(input.ipAddress !== undefined ? { ipAddress: input.ipAddress } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      createdAt: new Date().toISOString(),
    };
    const stored = await this.store.insert(entry);
    this.logger.debug({ auditId: stored.id, action: stored.action }, "audit_logger.recorded");
    return stored;
  }

  async get(id: string): Promise<AuditEntry | null> {
    return this.store.getById(id);
  }

  async list(query: AuditLogQuery = {}): Promise<AuditEntry[]> {
    return this.store.list(query);
  }
}
