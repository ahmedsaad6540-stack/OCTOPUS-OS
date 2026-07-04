import type { Brain, BrainEvent } from "@workspace/brain";

/**
 * A `task.failed` event's payload is the full `OctopusTask` that exhausted
 * its retries (see `TaskQueue.fail` in `@workspace/task-queue`). Only the
 * fields this rule needs are declared here — same "depend on the shape you
 * use, not the package" spirit as `@workspace/brain`'s own decoupling from
 * `@workspace/event-bus` and `@workspace/task-queue`.
 */
interface FailedTaskPayload {
  id: string;
  type: string;
  queue: string;
  error: string | null;
  attempts: number;
}

/**
 * OS Core's first decision rule: when a task exhausts its retries, the
 * Brain doesn't know or care who should be notified — it just decides that
 * *something* needs attention, records why, and publishes a
 * `brain.alert.task_failed` event. Future modules (a notifications agent,
 * an ops dashboard subscriber, ...) can react to that alert without the
 * Brain ever needing to know they exist.
 */
function taskFailureAlertRule(): Parameters<Brain["registerRule"]>[0] {
  return {
    name: "task-failure-alert",
    pattern: "task.failed",
    evaluate(event: BrainEvent<FailedTaskPayload>) {
      const task = event.payload;
      return {
        action: "publish_event",
        reason: `task ${task.id} (${task.type}) failed permanently after ${task.attempts} attempt(s)`,
        event: {
          type: "brain.alert.task_failed",
          payload: {
            taskId: task.id,
            taskType: task.type,
            queue: task.queue,
            error: task.error,
            attempts: task.attempts,
          },
        },
      };
    },
  };
}

/**
 * Registers every decision rule OS Core ships with today. Called once at
 * process startup (see `../index.ts`). As agents and other modules come
 * online, their rules get added here too — this is the one place that
 * decides what the Brain is currently paying attention to.
 */
export function registerCoreRules(brain: Brain): void {
  brain.registerRule(taskFailureAlertRule());
}
