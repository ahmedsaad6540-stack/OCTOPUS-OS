const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });

async function run() {
  try {
    const res = await pool.query('SELECT id, name FROM agents ORDER BY created_at ASC');
    const seen = new Set();
    const toDelete = [];
    
    for (const row of res.rows) {
      if (!seen.has(row.name)) {
        seen.add(row.name);
      } else {
        toDelete.push(row.id);
      }
    }
    
    console.log('Deleting:', toDelete.length);
    
    let deletedCount = 0;
    for (const id of toDelete) {
      const delRes = await pool.query('DELETE FROM agents WHERE id = $1', [id]);
      deletedCount += delRes.rowCount;
    }
    console.log('Successfully deleted:', deletedCount);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
