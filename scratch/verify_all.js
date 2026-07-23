const { Client } = require('pg');

async function run() {
  const dbUrl = 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway';
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    
    // Get all users
    const users = await client.query('SELECT id FROM users');
    for (const user of users.rows) {
      const userId = user.id;

      // Upsert for digistore24
      await client.query(`
        INSERT INTO affiliate_connections (id, user_id, provider, affiliate_id, credential_status, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 'digistore24', 'octopuslabai4418', 'verified', 'active', NOW(), NOW())
        ON CONFLICT (user_id, provider) DO UPDATE SET credential_status = 'verified', status = 'active', affiliate_id = 'octopuslabai4418'
      `, [userId]);

      // Upsert for amazon
      await client.query(`
        INSERT INTO affiliate_connections (id, user_id, provider, affiliate_id, credential_status, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 'amazon', 'octopusai-21', 'verified', 'active', NOW(), NOW())
        ON CONFLICT (user_id, provider) DO UPDATE SET credential_status = 'verified', status = 'active', affiliate_id = 'octopusai-21'
      `, [userId]);

      // Upsert for impact
      await client.query(`
        INSERT INTO affiliate_connections (id, user_id, provider, affiliate_id, credential_status, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 'impact', '7482519', 'verified', 'active', NOW(), NOW())
        ON CONFLICT (user_id, provider) DO UPDATE SET credential_status = 'verified', status = 'active', affiliate_id = '7482519'
      `, [userId]);
      
      console.log("Updated connections to verified for user", userId);
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}

run();
