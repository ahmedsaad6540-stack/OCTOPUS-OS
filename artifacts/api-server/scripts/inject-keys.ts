import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { sql, eq } from "drizzle-orm";

async function run() {
  try {
    console.log("Creating affiliate_connections if not exists...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS affiliate_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        affiliate_id TEXT DEFAULT '',
        encrypted_secret_envelope TEXT,
        credential_status TEXT NOT NULL DEFAULT 'not_configured',
        permissions TEXT DEFAULT 'read_only',
        capabilities JSONB DEFAULT '{}',
        last_verified_at TIMESTAMP,
        last_error_code TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        connection_source TEXT DEFAULT 'mock',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMP,
        UNIQUE (user_id, provider)
      );
    `);
    
    console.log("Creating affiliate_products if not exists...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS affiliate_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        external_product_id TEXT NOT NULL,
        name TEXT NOT NULL,
        catalog_source TEXT NOT NULL,
        promolink TEXT,
        partnership_status TEXT NOT NULL DEFAULT 'unknown',
        commission_value TEXT,
        commission_type TEXT,
        commission_verification TEXT DEFAULT 'unverified',
        raw_metadata JSONB DEFAULT '{}',
        is_active TEXT DEFAULT 'true',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, provider, external_product_id)
      );
    `);

    // 1. Get the admin user
    const users = await db.select().from(usersTable).where(eq(usersTable.email, "admin@octopus.ai"));
    if (users.length === 0) {
      console.log("No admin user found.");
      process.exit(1);
    }
    const userId = users[0].id;
    console.log("Found admin user ID:", userId);

    // 2. Insert Digistore24 affiliate connection
    await db.execute(sql`
      INSERT INTO affiliate_connections (user_id, provider, affiliate_id, credential_status)
      VALUES (${userId}, 'digistore24', 'octopuslabai4418', 'configured')
      ON CONFLICT (user_id, provider) DO UPDATE SET affiliate_id = 'octopuslabai4418', credential_status = 'configured'
    `);
    console.log("Inserted Digistore24 connection.");

    // 3. Insert Amazon affiliate connection
    await db.execute(sql`
      INSERT INTO affiliate_connections (user_id, provider, affiliate_id, credential_status)
      VALUES (${userId}, 'amazon', 'octopusai-21', 'configured')
      ON CONFLICT (user_id, provider) DO UPDATE SET affiliate_id = 'octopusai-21', credential_status = 'configured'
    `);
    console.log("Inserted Amazon connection.");

    // 4. Insert Water Revolution promolink
    await db.execute(sql`
      INSERT INTO affiliate_products (user_id, provider, external_product_id, name, catalog_source, promolink, partnership_status, commission_verification)
      VALUES (${userId}, 'custom', 'water-revolution', 'Water Revolution', 'manual_promolink_import', 'https://uswaterrevolution.com/#aff=octopuslabai4418', 'user_declared_approved', 'user_supplied')
      ON CONFLICT (user_id, provider, external_product_id) DO UPDATE SET promolink = 'https://uswaterrevolution.com/#aff=octopuslabai4418'
    `);
    console.log("Inserted Water Revolution promolink.");

    // 5. Insert Digistore24 specific promolink
    await db.execute(sql`
      INSERT INTO affiliate_products (user_id, provider, external_product_id, name, catalog_source, promolink, partnership_status, commission_verification)
      VALUES (${userId}, 'digistore24', '660957', 'Digistore24 Promo 660957', 'manual_promolink_import', 'https://www.digistore24.com/redir/660957/octopuslabai4418/', 'user_declared_approved', 'user_supplied')
      ON CONFLICT (user_id, provider, external_product_id) DO UPDATE SET promolink = 'https://www.digistore24.com/redir/660957/octopuslabai4418/'
    `);
    console.log("Inserted Digistore24 specific promolink.");

    console.log("Successfully injected all keys and links.");
    process.exit(0);
  } catch (error) {
    console.error("Error running injection script:", error);
    process.exit(1);
  }
}

run();
