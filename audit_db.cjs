const { Client } = require('pg');
const { execSync } = require('child_process');

async function run() {
  console.log("Checking DB connections...");
  let dbVarsOutput = execSync('railway variable list --service Postgres -e production --json', { encoding: 'utf-8' });
  const dbVariables = JSON.parse(dbVarsOutput);
  const dbUrl = dbVariables.DATABASE_PUBLIC_URL;

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("=== affiliate_connections ===");
  try {
    const res = await client.query('SELECT provider, credential_status, status FROM affiliate_connections');
    console.log(res.rows);
  } catch (e) { console.log(e.message); }

  console.log("=== social_accounts ===");
  try {
    const res = await client.query('SELECT platform, username, LENGTH(access_token) as token_len FROM social_accounts WHERE status=\'connected\'');
    console.log("social_accounts:", res.rows);
  } catch (e) { console.log("social_accounts error:", e.message); }

  console.log("=== affiliate_networks columns ===");
  try {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'affiliate_networks'");
    console.log("columns:", res.rows.map(r => r.column_name));
    
    // Also get the records
    const records = await client.query("SELECT * FROM affiliate_networks");
    console.log("records:", records.rows.map(r => { 
       const sanitized = {...r}; 
       if(sanitized.api_key) sanitized.api_key = 'REDACTED'; 
       return sanitized; 
    }));
  } catch (e) { console.log("affiliate_networks error:", e.message); }

  await client.end();
}
run();
