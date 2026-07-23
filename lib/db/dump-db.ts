import { db } from "./src/index.js";
import { taskQueueTable } from "./src/schema/tasks.js";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const res = await db.update(taskQueueTable)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(taskQueueTable.status, "failed"))
      .returning();
    console.log(`Re-queued ${res.length} failed tasks.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
