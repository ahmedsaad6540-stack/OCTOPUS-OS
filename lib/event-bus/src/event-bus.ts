import { randomUUID } from "node:crypto";
import type {
  EventBusLogger,
  EventHandler,
  EventQuery,
  EventStore,
  HandlerFailure,
  OctopusEvent,
  PublishOptions,
  Unsubscribe,
} from "./types.js";

interface Subscription {
  id: string;
  /** Exact type match, or a "namespace.*" prefix wildcard, or "*" for everything. */
  pattern: string;
  handlerName: string;
  handler: EventHandler;
}

function matches(pattern: string, type: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    return type.startsWith(pattern.slice(0, -1));
  }
  return pattern === type;
}

const noopLogger: EventBusLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * The single communication channel for the whole of OCTOPUS OS.
 *
 * This is a foundational architectural constraint, not an implementation
 * detail: agents never call each other directly, and modules never reach
 * into each other's internals. Everything — the Brain's decisions, agent
 * task results, learning updates, reflection output — is a published event
 * that interested parties subscribe to. This class is the only thing that
 * is allowed to fan an event out to multiple listeners.
 */
export class EventBus {
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly inFlight = new Set<Promise<void>>();

  constructor(
    private readonly store: EventStore,
    private readonly logger: EventBusLogger = noopLogger,
  ) {}

  /**
   * Publish an event. The event is durably persisted before any subscriber
   * runs, and each subscriber is isolated: one handler throwing never
   * prevents another handler for the same event from running, and never
   * throws back into the publisher. Callers that need to know whether
   * dispatch succeeded should subscribe to failure events rather than
   * awaiting side effects of `publish`.
   */
  async publish<TPayload>(
    type: string,
    source: string,
    payload: TPayload,
    options: PublishOptions = {},
  ): Promise<OctopusEvent<TPayload>> {
    const event: OctopusEvent<TPayload> = {
      id: randomUUID(),
      type,
      version: options.version ?? 1,
      source,
      payload,
      metadata: {
        correlationId: options.correlationId ?? randomUUID(),
        ...(options.causationId ? { causationId: options.causationId } : {}),
        ...(options.userId ? { userId: options.userId } : {}),
      },
      occurredAt: new Date().toISOString(),
    };

    await this.store.persist(event as OctopusEvent);

    const dispatch = this.dispatch(event as OctopusEvent);
    this.inFlight.add(dispatch);
    dispatch.finally(() => this.inFlight.delete(dispatch));

    this.logger.info(
      { eventId: event.id, type: event.type, source, correlationId: event.metadata.correlationId },
      "event.published",
    );

    return event;
  }

  /**
   * Subscribe to an exact event type, or a "namespace.*" wildcard, or "*"
   * for every event on the bus. Returns an unsubscribe function.
   */
  subscribe<TPayload>(
    pattern: string,
    handlerName: string,
    handler: EventHandler<TPayload>,
  ): Unsubscribe {
    const id = randomUUID();
    this.subscriptions.set(id, {
      id,
      pattern,
      handlerName,
      handler: handler as EventHandler,
    });
    return () => {
      this.subscriptions.delete(id);
    };
  }

  /** Query the persisted event history — the audit/replay log. */
  async history(query: EventQuery = {}): Promise<OctopusEvent[]> {
    return this.store.list(query);
  }

  async getEvent(eventId: string): Promise<OctopusEvent | null> {
    return this.store.getById(eventId);
  }

  /** Await all currently in-flight dispatches. Used on graceful shutdown. */
  async drain(): Promise<void> {
    await Promise.all(Array.from(this.inFlight));
  }

  private async dispatch(event: OctopusEvent): Promise<void> {
    const matching = Array.from(this.subscriptions.values()).filter((s) =>
      matches(s.pattern, event.type),
    );

    if (matching.length === 0) {
      await this.store.recordDispatch(event.id, { status: "dispatched", handlerErrors: [] });
      return;
    }

    const results = await Promise.allSettled(
      matching.map((s) => Promise.resolve(s.handler(event))),
    );

    const handlerErrors: HandlerFailure[] = [];
    results.forEach((result, i) => {
      const sub = matching[i];
      if (!sub) return;
      if (result.status === "rejected") {
        const error =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        handlerErrors.push({ handler: sub.handlerName, error, failedAt: new Date().toISOString() });
        this.logger.error(
          { eventId: event.id, type: event.type, handler: sub.handlerName, error },
          "event.handler_failed",
        );
      }
    });

    await this.store.recordDispatch(event.id, {
      status: handlerErrors.length > 0 ? "failed" : "dispatched",
      handlerErrors,
    });
  }
}
