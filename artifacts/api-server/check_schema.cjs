const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('affiliate_networks', 'social_accounts', 'users');
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Check if there are users so we can associate affiliate networks with a user.
    const users = await pool.query('SELECT id, email FROM users;');
    console.log('Users:', users.rows);

    const social = await pool.query('SELECT * FROM social_accounts;');
    console.log('Social Accounts:', social.rows);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
