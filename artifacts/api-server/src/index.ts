import "./tracing"; // must be first — see tracing.ts's doc comment
import app from "./app";
import { logger } from "./lib/logger";
import { eventBus } from "./lib/event-bus";
import { taskQueue } from "./lib/task-queue";
import { brain } from "./lib/brain";
import { registerCoreRules } from "./lib/brain-rules";
import { ruleEngine } from "./lib/rule-engine";
import { scheduler } from "./lib/scheduler";
import "./lib/notification-manager";

// Register the Brain's code-defined decision rules before anything is
// published, so day-one events (system.startup included) are visible to it.
registerCoreRules(brain);

// Load and register every enabled data-defined rule from the Rule Engine on
// top of the code-defined ones above — the Brain doesn't distinguish where
// a registered rule came from.
await ruleEngine.loadAndSync();

// Start ticking the Scheduler once everything it can dispatch to (the
// Workflow Engine, the Task Queue) is already wired up above.
scheduler.start();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  void eventBus.publish("system.startup", "api-server", {
    port,
    nodeEnv: process.env.NODE_ENV ?? "development",
  });
});

// Periodically requeue tasks abandoned by crashed/killed workers. This is
// the Queue Manager's redelivery guarantee in practice: a claimed task
// that never gets completed or failed doesn't sit stuck forever.
const RECLAIM_STALE_INTERVAL_MS = 60_000;
const reclaimStaleInterval = setInterval(() => {
  taskQueue.reclaimStale().catch((err) => {
    logger.error({ err }, "Error reclaiming stale tasks");
  });
}, RECLAIM_STALE_INTERVAL_MS);
reclaimStaleInterval.unref();

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "Shutdown signal received, draining");

  clearInterval(reclaimStaleInterval);
  scheduler.stop();

  await eventBus.publish("system.shutdown", "api-server", { signal });
  // Give the shutdown event a moment to be persisted/dispatched before we
  // stop accepting work.
  await eventBus.drain();

  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during server close");
      process.exit(1);
    }
    logger.info({}, "Server closed cleanly");
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
