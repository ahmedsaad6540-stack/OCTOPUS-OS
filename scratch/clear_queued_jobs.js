const { Client } = require('pg');

async function run() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway';
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("Clearing stuck video jobs...");
  const res = await client.query(`DELETE FROM video_jobs WHERE status = 'queued'`);
  console.log(`Deleted ${res.rowCount} stuck jobs.`);
  
  await client.end();
}

run().catch(console.error);
