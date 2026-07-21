import 'dotenv/config';
console.log('DEBUG DATABASE_URL:', process.env.DATABASE_URL);

process.on("uncaughtException", (err) => {
  console.error("[24/7 Resilience] Caught uncaughtException:", err.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[24/7 Resilience] Caught unhandledRejection:", reason);
});

/// import "./tracing"; // Disabled temporarily for Railway deployment
import app from "./app";
import { logger } from "./lib/logger";
import { eventBus } from "./lib/event-bus";
import { taskQueue } from "./lib/task-queue";
import { brain } from "./lib/brain";
import { registerCoreRules } from "./lib/brain-rules";
import { ruleEngine } from "./lib/rule-engine";
import { registerRealToolHandlers, ensureRealToolsRegistered } from "./lib/real-tools-registry";
import { scheduler } from "./lib/scheduler";
import { startAutonomousDaemon } from "./lib/autonomous-daemon";
import "./lib/notification-manager";
import { CampaignWorker } from "./lib/campaign-worker.js";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const REQUIRED_ENV_VARS = ["DATABASE_URL"];
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

    // Register real concrete tool handlers and seed database tool definitions
    registerRealToolHandlers();
    await ensureRealToolsRegistered();

    // Auto-seed default admin account if table is empty
    try {
      const email = "admin@octopus.ai";
      const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase()))
        .limit(1);
      if (existing.length === 0) {
        const hashed = await bcrypt.hash("octopus123", 12);
        await db.insert(usersTable).values({
          email: email.toLowerCase(),
          password: hashed,
          name: "Ahmed Saad",
          role: "admin",
        });
        logger.info("Default admin user Ahmed Saad seeded successfully into PostgreSQL.");
      }
    } catch (err) {
      logger.error({ err }, "Error checking/seeding default admin user");
    }

    // Start ticking the Scheduler once everything it can dispatch to is wired up.
    scheduler.start();
    startAutonomousDaemon();
    CampaignWorker.start();

    const rawPort = process.env.PORT ?? "5173";
    const port = Number(rawPort);
    if (!Number.isFinite(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
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
    console.error("================================");
    console.error("API SERVER STARTUP ERROR");
    console.error(error);
    console.error("================================");

    logger.fatal(
      {
        err: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      },
      "Failed to start API Server due to initialization error"
    );

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
  CampaignWorker.stop();

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