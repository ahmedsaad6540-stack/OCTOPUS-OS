import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

const { Pool } = pg;
let dbInstance: any;
export let pgClient: any = null;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://test:test@localhost:5432/test" });

if (process.env.USE_PGLITE === "true") {
  pgClient = new PGlite();
  dbInstance = drizzlePgLite(pgClient, { schema });
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  pool.on("error", (err) => {
    console.error("[Database Pool Error] Caught unexpected error on idle PostgreSQL client:", err.message || err);
  });
  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance;

export * from "./schema";
