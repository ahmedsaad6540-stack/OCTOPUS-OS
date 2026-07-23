const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });
pool.query("UPDATE campaigns SET product_url = 'https://www.amazon.eg/s?k=echo+smart+speaker&tag=octopusai-21' WHERE affiliate_network = 'Amazon Associates'").then(() => {
  console.log('Updated amazon affiliate link successfully');
  process.exit(0);
}).catch(console.error);
