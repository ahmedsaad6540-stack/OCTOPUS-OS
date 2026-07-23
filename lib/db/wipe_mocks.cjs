const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

async function main() {
  const res = await pool.query("SELECT id FROM users WHERE email='octopus@admin.ai'");
  if (res.rows.length === 0) {
    console.error('User not found');
    process.exit(1);
  }
  const userId = res.rows[0].id;
  
  // Wipe out fake social accounts
  await pool.query("DELETE FROM social_accounts WHERE user_id=$1", [userId]);
  console.log('✅ Deleted mock social accounts');

  // Wipe out fake campaigns
  await pool.query("DELETE FROM campaigns WHERE user_id=$1", [userId]);
  console.log('✅ Deleted mock campaigns');
  
  // Wipe out any video jobs
  await pool.query("DELETE FROM video_jobs WHERE user_id=$1", [userId]);
  console.log('✅ Deleted video jobs');

  process.exit(0);
}

main().catch(console.error);
