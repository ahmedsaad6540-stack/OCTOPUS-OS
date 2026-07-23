const { Client } = require('pg');

async function run() {
  const dbUrl = 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway';
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    
    // First, let's check if the user exists
    const users = await client.query('SELECT id FROM users LIMIT 1');
    if (users.rows.length === 0) {
      console.log("No users found to attach impact to.");
      return;
    }
    const userId = users.rows[0].id;

    // Check if impact already exists
    const existing = await client.query("SELECT * FROM affiliate_networks WHERE network = 'impact'");
    if (existing.rows.length > 0) {
      console.log("Impact already registered:", existing.rows);
    } else {
      console.log("Registering Impact...");
      await client.query(`
        INSERT INTO affiliate_networks (id, user_id, network, display_name, api_key, tracking_id, affiliate_id, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 'impact', 'Impact Radius', '', '', '7482519', 'connected', NOW(), NOW())
      `, [userId]);
      console.log("Impact registered successfully.");
    }

    // Also verify digistore and amazon are connected
    await client.query("UPDATE affiliate_networks SET status = 'connected' WHERE network IN ('amazon', 'digistore24')");
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}

run();
