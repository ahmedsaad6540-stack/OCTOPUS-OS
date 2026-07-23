const { Client } = require('pg');

const c = new Client('postgresql://postgres:REDACTED@localhost:5432/octopus_test');

c.connect().then(() => {
  return c.query("SELECT id, name, status, published_url FROM campaigns WHERE name = 'E2E Test Campaign' ORDER BY created_at DESC LIMIT 1");
}).then(r => {
  console.log("DB Persistence Verification:");
  console.log(r.rows);
}).catch(console.error).finally(() => c.end());
