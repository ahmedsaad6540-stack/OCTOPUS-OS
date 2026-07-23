const { Client } = require('pg');
const run = async () => {
  const client = new Client({
    connectionString: "postgresql://postgres:wSgqKpsVwItnEqTjXFUXLqVjYpZqUaQJ@autorack.proxy.rlwy.net:18635/railway",
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query(`SELECT id, name, status FROM agents`);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
};
run();
