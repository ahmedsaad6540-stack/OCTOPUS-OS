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
  
  const q = `
    INSERT INTO social_accounts (user_id, platform, status, profile_data, auth_data) 
    VALUES 
      ($1, 'tiktok', 'connected', '{"username":"TikTokPro"}'::jsonb, '{}'::jsonb), 
      ($1, 'youtube', 'connected', '{"username":"YouTubeStar"}'::jsonb, '{}'::jsonb), 
      ($1, 'instagram', 'connected', '{"username":"InstaGuru"}'::jsonb, '{}'::jsonb)
  `;
  
  await pool.query(q, [userId]);
  console.log('✅ Social accounts added');
  process.exit(0);
}

main().catch(console.error);
