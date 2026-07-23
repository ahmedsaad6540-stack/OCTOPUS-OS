const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/octopus_test' });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM affiliate_networks');
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}
check();
