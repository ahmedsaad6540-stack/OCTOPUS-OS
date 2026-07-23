/**
 * Two distinct, deliberately small responsibilities live here:
 *
 * - `AuditLogger` records who did what, to what, and when. It's a plain
 *   write/read path over its own `audit_log` table — every other module's
 *   own table already has `createdAt`/`userId` on the entity itself, but
 *   none of them record a cross-cutting, append-only trail of actions
 *   across the whole system in one place. Populated automatically by an
 *   Express middleware in the api-server (see `replit.md`), not by editing
 *   every route file individually.
 *
 * - `ObservabilityService` aggregates a system status snapshot from
 *   `MetricsProbe`s registered by whoever wires it up. It has no idea what
 *   a probe actually queries — the api-server registers one probe per
 *   module, each just calling that module's own already-public `list()`
 *   (or similar) method. This package never queries another module's
 *   store directly; it only orchestrates calling probes and merging their
 *   results, isolating one probe's failure from the rest the same way the
 *   Event Bus isolates one subscriber's failure from others.
 */

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  /** e.g. "rule.created", "agent.disabled", "auth.login" — `<resourceType>.<verb>` by convention, not enforced. */
  action: string;
  resourceType: string;
  resourceId?: string;
  actorUserId?: string;
  actorRole?: string;
  ipAddress?: string;
  metadata?: unknown;
  createdAt: string;
}

export interface CreateAuditEntryInput {
  action: string;
  resourceType: string;
  resourceId?: string;
  actorUserId?: string;
  actorRole?: string;
  ipAddress?: string;
  metadata?: unknown;
}

export interface AuditLogQuery {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorUserId?: string;
  limit?: number;
}

export interface AuditLogStore {
  insert(entry: AuditEntry): Promise<AuditEntry>;
  getById(id: string): Promise<AuditEntry | null>;
  list(query: AuditLogQuery): Promise<AuditEntry[]>;
}

export interface AuditObservabilityLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------

export interface MetricsProbe {
  /** Section key in the resulting `SystemStatus.sections`. Must be unique among registered probes. */
  name: string;
  collect(): Promise<Record<string, unknown>>;
}

export interface SystemStatus {
  timestamp: string;
  uptimeSeconds: number;
  /** One entry per successfully-collected probe, keyed by `MetricsProbe.name`. */
  sections: Record<string, Record<string, unknown>>;
  /** One entry per probe that threw, keyed by `MetricsProbe.name`, mapping to its error message. A failing probe never prevents the others from reporting. */
  errors: Record<string, string>;
}
