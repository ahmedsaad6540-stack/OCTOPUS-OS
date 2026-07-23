const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:REDACTED@localhost:5432/octopus_test'
});
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'provider_configs'").then(res => {
  console.log(res.rows.map(r => r.column_name));
  pool.end();
});
