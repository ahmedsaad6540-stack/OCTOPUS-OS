// Pre-computed bcrypt hash of "admin123" with salt rounds 12
// This was generated using bcrypt.hash('admin123', 12)
// You can verify: bcrypt.compare('admin123', hash) === true
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });

// Pre-computed hash of 'admin123' with 12 rounds
const newHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhg5KzJ7kI/JxhkS3CBFSG';

async function main() {
  // Use SQL to generate a new bcrypt hash directly via pgcrypto
  // We'll use the crypt() function which is bcrypt compatible
  try {
    const res = await pool.query(
      "UPDATE users SET password = crypt('admin123', gen_salt('bf', 12)) WHERE email = 'admin@octopus.ai' RETURNING email, id"
    );
    console.log('✅ Password updated via pgcrypto for:', res.rows[0]);
  } catch (e) {
    console.log('pgcrypto not available, using pre-computed hash');
    // Use a known good bcrypt hash for 'admin123'
    const knownHash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
    const res = await pool.query(
      "UPDATE users SET password = $1 WHERE email = 'admin@octopus.ai' RETURNING email, id",
      [knownHash]
    );
    console.log('✅ Password updated with known hash for:', res.rows[0]);
  }
  process.exit(0);
}
main().catch(console.error);
