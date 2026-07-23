const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });
pool.query("UPDATE campaigns SET product_url = 'https://www.digistore24.com/redir/660957/octopuslabai4418/'").then(() => {
  console.log('Updated affiliate link successfully');
  process.exit(0);
}).catch(console.error);
