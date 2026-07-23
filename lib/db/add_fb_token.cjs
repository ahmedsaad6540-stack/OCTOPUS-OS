const { Client } = require('pg');

const run = async () => {
  const client = new Client({
    connectionString: "postgresql://postgres:wSgqKpsVwItnEqTjXFUXLqVjYpZqUaQJ@autorack.proxy.rlwy.net:18635/railway",
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    const userId = "d0191c97-6a56-427c-9ef1-f09b537f7c1b"; // Admin userId
    const token = "EAAZAQIJ5hxIkBSIgdyM7JjPFweJIGakLTMbZCfhHHw6SOnprveJhIZBJk5TJ1bvzV0l3ynEfQBQwAQpq5hlqsvTN4orB3uCnU2ekBRWUEiow7JktV1pbfVmvS5GaPfeHF0BZBrcKheLERidLxjYJawLfI5T0mhiGbDm7ZC1ap3L1BLVv8KZB8x05J7YmtOm77w9Nkc1aYJ7IfaWZBfsWbZAuyahCV4o5xDUXa4xj";

    // Insert Facebook
    await client.query(`
      INSERT INTO social_accounts (id, user_id, platform, status, access_token, connection_source, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'facebook', 'connected', $2, 'manual', NOW(), NOW())
      ON CONFLICT (user_id, platform) DO UPDATE 
      SET access_token = EXCLUDED.access_token, status = 'connected', connection_source = 'manual', updated_at = NOW()
    `, [userId, token]);

    // Insert Instagram
    await client.query(`
      INSERT INTO social_accounts (id, user_id, platform, status, access_token, connection_source, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'instagram', 'connected', $2, 'manual', NOW(), NOW())
      ON CONFLICT (user_id, platform) DO UPDATE 
      SET access_token = EXCLUDED.access_token, status = 'connected', connection_source = 'manual', updated_at = NOW()
    `, [userId, token]);

    console.log("✅ Facebook & Instagram tokens injected into database successfully!");
  } catch (err) {
    console.error("❌ Failed:", err);
  } finally {
    await client.end();
  }
};

run();
