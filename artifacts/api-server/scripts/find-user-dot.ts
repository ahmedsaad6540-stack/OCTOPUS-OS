import { db } from "@workspace/db";
import { usersTable, socialAccountsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const targetEmail = "octopuslab.ai@gmail.com";
  console.log(`Searching for user with email: ${targetEmail}`);
  
  const users = await db.select().from(usersTable).where(eq(usersTable.email, targetEmail));
  console.log("Users found:", JSON.stringify(users, null, 2));

  if (users.length > 0) {
    const userId = users[0].id;
    const accounts = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.userId, userId));
    console.log("Social Accounts connected to this user:", JSON.stringify(accounts, null, 2));
  }
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
