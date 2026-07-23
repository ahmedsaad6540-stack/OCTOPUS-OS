const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' }); 
pool.query("SELECT email FROM users WHERE id = 'c0cf7cfd-38c4-4ef4-aaa5-64773407063c'").then(res => { 
  console.log(res.rows); 
  process.exit(0); 
}).catch(console.error);
