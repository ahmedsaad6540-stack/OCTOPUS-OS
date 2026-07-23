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
    INSERT INTO social_accounts (user_id, platform, status, username, display_name, followers, connection_source) 
    VALUES 
      ($1, 'tiktok', 'connected', 'TikTokPro', 'TikTok Pro Agent', '50.2k', 'mock'), 
      ($1, 'youtube', 'connected', 'YouTubeStar', 'YouTube Star', '120k', 'mock'), 
      ($1, 'instagram', 'connected', 'InstaGuru', 'Insta Guru', '85k', 'mock'),
      ($1, 'facebook', 'connected', 'FBCreator', 'FB Creator', '10k', 'mock')
  `;
  
  await pool.query(q, [userId]);
  console.log('✅ Social accounts added');
  process.exit(0);
}

main().catch(console.error);
