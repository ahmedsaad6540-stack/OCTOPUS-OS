const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });
const targetUserId = 'c0cf7cfd-38c4-4ef4-aaa5-64773407063c';
Promise.all([
  pool.query(`UPDATE campaigns SET user_id = '${targetUserId}'`),
  pool.query(`UPDATE video_jobs SET user_id = '${targetUserId}'`)
]).then(() => {
  console.log('Updated user_id successfully');
  process.exit(0);
}).catch(console.error);
