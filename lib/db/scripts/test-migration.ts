import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "fs";
import path from "path";

async function run() {
  console.log("Setting up isolated PGLite database...");
  const dbClient = new PGlite();
  const db = drizzle(dbClient);
  
  const migrationSql = readFileSync(path.join(process.cwd(), "drizzle/0000_fair_exodus.sql"), "utf-8");
  
  // Split statements and filter empty ones
  const statements = migrationSql.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s.length > 0);
  
  console.log(`Found ${statements.length} migration statements. Executing...`);
  for (const statement of statements) {
    try {
      await dbClient.exec(statement);
    } catch (e) {
      console.error("Failed executing statement:", statement);
      throw e;
    }
  }
  
  console.log("Migration applied successfully!");
  
  const tablesResult: any = await dbClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
  `);
  
  const tables = tablesResult.rows?.map((r: any) => r.table_name) || [];
  console.log("Tables created:", tables.filter((t: string) => t.includes("affiliate")));
  
  console.log("Verifying Constraints...");
  const constraintsResult: any = await dbClient.query(`
    SELECT conname, contype 
    FROM pg_constraint 
    WHERE contype = 'u';
  `);
  console.log("Constraints found:", constraintsResult.rows);
  
  await dbClient.close();
}

run().catch(console.error);
