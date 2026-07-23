const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });

async function main() {
  // Find the columns in users table
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
  console.log('Users columns:', cols.rows.map(r => r.column_name));

  // Get admin user
  const user = await pool.query("SELECT * FROM users WHERE email = 'admin@octopus.ai' LIMIT 1");
  if (user.rows.length) {
    const u = user.rows[0];
    console.log('\nAdmin user:');
    // Print each field except long hashes
    Object.entries(u).forEach(([k, v]) => {
      const val = String(v);
      console.log(` ${k}: ${val.length > 80 ? val.slice(0,80)+'...' : val}`);
    });
  } else {
    console.log('No admin@octopus.ai found!');
  }
  process.exit(0);
}
main().catch(console.error);
