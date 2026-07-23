import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

async function run() {
  const users = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name }).from(usersTable);
  console.log("All Registered Users:", JSON.stringify(users, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
