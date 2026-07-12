// import "./tracing"; // مؤقتًا لحل مشكلة Railway
import app from "./app";
import { logger } from "./lib/logger";
import { eventBus } from "./lib/event-bus";
import { taskQueue } from "./lib/task-queue";
import { brain } from "./lib/brain";
import { registerCoreRules } from "./lib/brain-rules";
import { ruleEngine } from "./lib/rule-engine";
import { scheduler } from "./lib/scheduler";
import "./lib/notification-manager";

const REQUIRED_ENV_VARS = ["PORT", "DATABASE_URL"];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    logger.fatal(`Startup failed: Missing required environment variable ${envVar}`);
    process.exit(1);
  }
}

async function startServer() {
  const bootStartTime = performance.now();

  try {
    // Register the Brain's code-defined decision rules before anything is
    // published, so day-one events (system.startup included) are visible to it.
    registerCoreRules(brain);

    // Load and register every enabled data-defined rule from the Rule Engine on
    // top of the code-defined ones above
    await ruleEngine.loadAndSync();

    // Start ticking the Scheduler once everything it can dispatch to is wired up.
    scheduler.start();

    const port = Number(process.env.PORT);
    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
    }

    const server = app.listen(port, (err?: any) => {
      if (err) {
        logger.fatal({ err }, "Error listening on port");
        process.exit(1);
      }

      const bootDurationMs = Math.round(performance.now() - bootStartTime);
      const memoryUsageMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

      logger.info(
        { port, bootDurationMs, memoryUsageMB },
        "Server listening successfully"
      );

      void eventBus.publish("system.startup", "api-server", {
        port,
        nodeEnv: process.env.NODE_ENV ?? "development",
        bootDurationMs,
        memoryUsageMB
      });
    });

    return server;
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start API Server due to initialization error");
    process.exit(1);
  }
}

const serverPromise = startServer();

// Periodically requeue tasks abandoned by crashed/killed workers.
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
  await eventBus.drain();

  try {
    const server = await serverPromise;
    server.close((err?: any) => {
      if (err) {
        logger.error({ err }, "Error during server close");
        process.exit(1);
      }
      logger.info({}, "Server closed cleanly");
      process.exit(0);
    });
  } catch (err) {
    logger.error({ err }, "Error awaiting server during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));