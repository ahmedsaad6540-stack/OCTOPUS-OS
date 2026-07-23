import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { videoJobsTable } from "../../lib/db/src/schema.js"; // adjust path as needed

async function run() {
  const connectionString = "postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/c3_2_test";
  const client = postgres(connectionString);
  const db = drizzle(client);

  const jobs = await db.select().from(videoJobsTable);
  console.log(JSON.stringify(jobs, null, 2));

  await client.end();
}

run().catch(console.error);
