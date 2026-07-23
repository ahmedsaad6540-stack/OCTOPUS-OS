/**
 * The Decision Engine is a small, pure arbitration library: given a set of
 * candidate actions that competing rules want to take for the same event,
 * it decides which one(s) actually get carried out. It has no knowledge of
 * events, tasks, or the Event Bus — the Brain is the only caller, and it's
 * the Brain that knows how to turn a winning candidate into an enqueued
 * task or a published event. This keeps the arbitration logic reusable
 * (the Rule Engine's conflict resolution, for instance, can use the same
 * strategies) and trivially unit-testable in isolation.
 */

export type ArbitrationAction = "enqueue_task" | "publish_event";

/**
 * One rule's candidate action for a single event, as seen by the Decision
 * Engine. `decision` is intentionally opaque (`unknown`) — the Decision
 * Engine only ever needs `action`/`priority`/`reason` to arbitrate; the
 * caller (Brain) is the one that knows what to do with the winning
 * candidate's `decision` payload.
 */
export interface ArbitrationCandidate {
  ruleName: string;
  action: ArbitrationAction;
  /** Higher wins. Rules default to priority 0. Ties are broken by registration order (stable). */
  priority: number;
  reason: string;
  decision: unknown;
}

export interface ArbitrationStrategy {
  /** Unique, stable name — recorded for observability wherever arbitration outcomes are logged. */
  name: string;
  /**
   * Given every actionable candidate for one event (in registration order),
   * return the subset that should actually be carried out, in the order
   * they should be carried out. Return `[]` if none should act. Must not
   * mutate the input array.
   */
  arbitrate(candidates: ArbitrationCandidate[]): ArbitrationCandidate[];
}
