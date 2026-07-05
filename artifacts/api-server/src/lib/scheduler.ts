import { db } from "@workspace/db";
import { Scheduler, DrizzleScheduledJobStore, DrizzleScheduledJobRunStore } from "@workspace/scheduler";
import { workflowEngine } from "./workflow-engine.js";
import { taskQueue } from "./task-queue.js";
import { logger } from "./logger.js";

/**
 * The one Scheduler for this process. `workflow`-targeted jobs run through
 * `workflowEngine.run()`, `task`-targeted jobs through `taskQueue.enqueue()`
 * — the Scheduler never reimplements either. Started in `index.ts` after
 * every other module is wired up; ticks every 30s by default.
 */
export const scheduler = new Scheduler(
  new DrizzleScheduledJobStore(db),
  new DrizzleScheduledJobRunStore(db),
  {
    workflowRunner: workflowEngine,
    taskEnqueuer: taskQueue,
  },
  logger,
);
