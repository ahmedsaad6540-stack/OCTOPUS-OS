const { Client } = require('pg');
const { execSync } = require('child_process');

async function r() { 
  const dbUrl = JSON.parse(execSync('railway variable list --service Postgres -e production --json', { encoding: 'utf-8' })).DATABASE_PUBLIC_URL; 
  const c = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } }); 
  await c.connect(); 
  
  try {
    await c.query("ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS connection_source text DEFAULT 'mock'"); 
    console.log('Column connection_source added to social_accounts.');
  } catch (e) {
    console.error(e.message);
  }

  try {
    await c.query("ALTER TABLE affiliate_connections ADD COLUMN IF NOT EXISTS connection_source text DEFAULT 'mock'"); 
    console.log('Column connection_source added to affiliate_connections.');
  } catch (e) {
    console.error(e.message);
  }
  
  await c.end(); 
} 
r();
