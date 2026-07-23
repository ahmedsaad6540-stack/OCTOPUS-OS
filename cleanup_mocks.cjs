const { Client } = require('pg');
const { execSync } = require('child_process');

async function cleanup() {
  const dbUrl = JSON.parse(execSync('railway variable list --service Postgres -e production --json', { encoding: 'utf-8' })).DATABASE_PUBLIC_URL;
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  await client.connect();
  console.log("Connected to DB. Starting cleanup...");

  try {
    const socialRes = await client.query(`
      UPDATE social_accounts 
      SET connection_source = 'mock', status = 'disconnected' 
    `);
    console.log(`Updated ${socialRes.rowCount} mock social_accounts to disconnected/mock.`);

    try {
      const affRes = await client.query(`
        UPDATE affiliate_connections 
        SET connection_source = 'mock', status = 'revoked', credential_status = 'not_configured'
      `);
      console.log(`Updated ${affRes.rowCount} mock affiliate_connections.`);
    } catch (e) {
      console.log("affiliate_connections not found or update failed:", e.message);
    }
    
    try {
       const delOld = await client.query("DELETE FROM affiliate_networks");
       console.log(`Deleted ${delOld.rowCount} records from deprecated affiliate_networks table.`);
    } catch (e) {
       console.log("affiliate_networks not found:", e.message);
    }

  } catch (e) {
    console.error("Cleanup error:", e);
  } finally {
    await client.end();
  }
}

cleanup();
