/**
 * Metadata carried by every event, used to trace causal chains through the
 * system (a Brain decision -> an agent task -> a learning update, etc.)
 * without any of those parties ever calling each other directly.
 */
export interface EventMetadata {
  /** Groups all events belonging to the same logical operation/request. */
  correlationId: string;
  /** The id of the event (if any) that directly caused this one. */
  causationId?: string;
  /** The user this event is scoped to, if applicable. */
  userId?: string;
}

/**
 * The envelope every published event is wrapped in. Payloads are opaque to
 * the bus itself — module-specific event catalogs define and own their own
 * payload shapes and publish/consume them through this envelope.
 */
export interface OctopusEvent<TPayload = unknown> {
  id: string;
  /** Dot-namespaced type, e.g. "campaign.created", "agent.prophet.prediction.completed". */
  type: string;
  /** Schema version of `payload`, so consumers can evolve payload shapes safely. */
  version: number;
  /** Identity of the publisher, e.g. "os-core", "agent:prophet", "api-server". */
  source: string;
  payload: TPayload;
  metadata: EventMetadata;
  occurredAt: string;
}

export interface PublishOptions {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  version?: number;
}

export type EventHandler<TPayload = unknown> = (
  event: OctopusEvent<TPayload>,
) => Promise<void> | void;

export type Unsubscribe = () => void;

export interface HandlerFailure {
  handler: string;
  error: string;
  failedAt: string;
}

export interface EventBusLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

/**
 * Persistence boundary for the bus. Swappable so the bus can run against
 * Postgres in production and against an in-memory store in tests, without
 * either the bus or its callers changing.
 */
export interface EventStore {
  persist(event: OctopusEvent): Promise<void>;
  recordDispatch(
    eventId: string,
    result: { status: "dispatched" | "failed"; handlerErrors: HandlerFailure[] },
  ): Promise<void>;
  list(query: EventQuery): Promise<OctopusEvent[]>;
  getById(eventId: string): Promise<OctopusEvent | null>;
}

export interface EventQuery {
  type?: string;
  correlationId?: string;
  userId?: string;
  limit?: number;
  before?: string;
}
