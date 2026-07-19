const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway";
const pool = new Pool({ connectionString });

async function seed() {
  try {
    console.log("Connecting to database...");
    
    // 1. Get ALL users
    const userRes = await pool.query("SELECT id FROM users");
    const users = userRes.rows;
    
    console.log(`Found ${users.length} users. Auto-connecting socials for all...`);

    const platformCreds = [
      { platform: "youtube",   displayName: "YouTube",   apiKey: "mock_api" },
      { platform: "tiktok",    displayName: "TikTok",    apiKey: "mock_api" },
      { platform: "facebook",  displayName: "Facebook",  apiKey: "mock_api" },
      { platform: "instagram", displayName: "Instagram", apiKey: "mock_api" },
      { platform: "elevenlabs",displayName: "ElevenLabs AI", apiKey: "mock_api" },
      { platform: "heygen",    displayName: "HeyGen AI", apiKey: "mock_api" },
    ];

    for (const user of users) {
      const userId = user.id;

      for (const cred of platformCreds) {
        // Insert new or update existing to connected
        await pool.query(`
          INSERT INTO social_accounts (user_id, platform, display_name, username, api_key, api_secret, status, access_token)
          VALUES ($1, $2, $3, $3, $4, 'secret', 'connected', 'auto_connected')
          ON CONFLICT DO NOTHING;
        `, [userId, cred.platform, cred.displayName, cred.apiKey]);
        
        await pool.query(`
          UPDATE social_accounts 
          SET status = 'connected'
          WHERE user_id = $1 AND platform = $2
        `, [userId, cred.platform]);
      }
    }

    console.log("Successfully seeded social accounts for all users!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed:", err);
    process.exit(1);
  }
}

seed();
