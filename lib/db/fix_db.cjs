const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

async function main() {
  // 1. Make user admin
  await pool.query("UPDATE users SET role = 'admin' WHERE email = 'octopus@admin.ai'");
  console.log('✅ User octopus@admin.ai is now admin');

  // 2. Create system_events table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ system_events table created');

  process.exit(0);
}

main().catch(console.error);
