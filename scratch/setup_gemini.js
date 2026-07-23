const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:REDACTED@localhost:5432/octopus_test'
});

async function run() {
  try {
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
       console.log('No users found.');
       return;
    }
    const uid = userRes.rows[0].id;
    
    // Un-default any existing configs
    await pool.query('UPDATE provider_configs SET is_default = false WHERE user_id = $1', [uid]);
    
    const existRes = await pool.query('SELECT id FROM provider_configs WHERE user_id = $1 AND provider_type = $2', [uid, 'gemini']);
    if (existRes.rows.length > 0) {
      console.log('Gemini config exists. Updating...');
      await pool.query('UPDATE provider_configs SET api_key_env_var = $1, is_default = true, model = $2 WHERE id = $3', ['GEMINI_API_KEY', 'gemini-1.5-pro', existRes.rows[0].id]);
    } else {
      console.log('Inserting new Gemini config...');
      const crypto = require('crypto');
      const cid = crypto.randomUUID();
      await pool.query('INSERT INTO provider_configs (id, user_id, name, provider_type, api_key_env_var, model, is_default, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [cid, uid, 'Google AI Studio', 'gemini', 'GEMINI_API_KEY', 'gemini-1.5-pro', true, 'active']);
    }
    console.log('Successfully set Gemini as default AI provider!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
