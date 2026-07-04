import { and, desc, eq, lt } from "drizzle-orm";
import { eventsTable, type EventRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  EventQuery,
  EventStore,
  HandlerFailure,
  OctopusEvent,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toOctopusEvent(record: EventRecord): OctopusEvent {
  return {
    id: record.id,
    type: record.type,
    version: record.version,
    source: record.source,
    payload: record.payload,
    metadata: {
      correlationId: record.correlationId,
      ...(record.causationId ? { causationId: record.causationId } : {}),
      ...(record.userId ? { userId: record.userId } : {}),
    },
    occurredAt: record.occurredAt.toISOString(),
  };
}

/**
 * Production event store, backed by the `events` table in Postgres. Every
 * publish is durably written before dispatch, and dispatch outcomes
 * (including per-handler failures) are recorded back onto the row so the
 * event history doubles as an audit log and a replay source.
 */
export class DrizzleEventStore implements EventStore {
  constructor(private readonly db: Db) {}

  async persist(event: OctopusEvent): Promise<void> {
    await this.db.insert(eventsTable).values({
      id: event.id,
      type: event.type,
      version: event.version,
      source: event.source,
      payload: event.payload,
      correlationId: event.metadata.correlationId,
      causationId: event.metadata.causationId ?? null,
      userId: event.metadata.userId ?? null,
      status: "published",
      occurredAt: new Date(event.occurredAt),
    });
  }

  async recordDispatch(
    eventId: string,
    result: { status: "dispatched" | "failed"; handlerErrors: HandlerFailure[] },
  ): Promise<void> {
    await this.db
      .update(eventsTable)
      .set({
        status: result.status,
        handlerErrors: result.handlerErrors.length > 0 ? result.handlerErrors : null,
        dispatchedAt: new Date(),
      })
      .where(eq(eventsTable.id, eventId));
  }

  async list(query: EventQuery): Promise<OctopusEvent[]> {
    const conditions = [];
    if (query.type) conditions.push(eq(eventsTable.type, query.type));
    if (query.correlationId) {
      conditions.push(eq(eventsTable.correlationId, query.correlationId));
    }
    if (query.userId) conditions.push(eq(eventsTable.userId, query.userId));
    if (query.before) conditions.push(lt(eventsTable.occurredAt, new Date(query.before)));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 50;

    const rows = await this.db
      .select()
      .from(eventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(eventsTable.occurredAt))
      .limit(Math.min(Math.max(safeLimit, 1), 200));

    return rows.map(toOctopusEvent);
  }

  async getById(eventId: string): Promise<OctopusEvent | null> {
    const rows = await this.db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1);

    return rows[0] ? toOctopusEvent(rows[0]) : null;
  }
}

/**
 * In-memory event store for unit tests and local scripts that don't want a
 * database dependency. Never used in production — the api-server always
 * wires up DrizzleEventStore.
 */
export class InMemoryEventStore implements EventStore {
  private readonly events = new Map<
    string,
    { event: OctopusEvent; status: "published" | "dispatched" | "failed"; handlerErrors: HandlerFailure[] }
  >();

  async persist(event: OctopusEvent): Promise<void> {
    this.events.set(event.id, { event, status: "published", handlerErrors: [] });
  }

  async recordDispatch(
    eventId: string,
    result: { status: "dispatched" | "failed"; handlerErrors: HandlerFailure[] },
  ): Promise<void> {
    const entry = this.events.get(eventId);
    if (!entry) return;
    entry.status = result.status;
    entry.handlerErrors = result.handlerErrors;
  }

  async list(query: EventQuery): Promise<OctopusEvent[]> {
    let results = Array.from(this.events.values()).map((e) => e.event);
    if (query.type) results = results.filter((e) => e.type === query.type);
    if (query.correlationId) {
      results = results.filter((e) => e.metadata.correlationId === query.correlationId);
    }
    if (query.userId) results = results.filter((e) => e.metadata.userId === query.userId);
    if (query.before) {
      const cutoff = query.before;
      results = results.filter((e) => e.occurredAt < cutoff);
    }
    results.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
    const safeLimit =
      typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 50;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 200));
  }

  async getById(eventId: string): Promise<OctopusEvent | null> {
    return this.events.get(eventId)?.event ?? null;
  }
}
