const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });
pool.query("UPDATE campaigns SET product_url = 'https://www.amazon.eg?&linkCode=ll2&tag=octopusai-21&linkId=926cdcd4290cb2c6840504860cf2348f&ref_=as_li_ss_tl' WHERE platform = 'tiktok'").then(() => {
  console.log('Updated amazon affiliate link successfully to exact link');
  process.exit(0);
}).catch(console.error);
