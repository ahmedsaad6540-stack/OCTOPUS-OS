const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

async function main() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='social_accounts'");
  console.log(res.rows.map(r => r.column_name));
  process.exit(0);
}

main().catch(console.error);
