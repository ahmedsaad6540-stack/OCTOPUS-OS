const { Client } = require('pg');

async function run() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway';
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("Fixing empty product URLs...");
  const res = await client.query(`UPDATE campaigns SET product_url = 'https://www.digistore24.com/redir/660957/octopuslabai4418/' WHERE product_url = '' OR product_url IS NULL`);
  console.log(`Updated ${res.rowCount} campaigns.`);
  
  await client.end();
}

run().catch(console.error);
