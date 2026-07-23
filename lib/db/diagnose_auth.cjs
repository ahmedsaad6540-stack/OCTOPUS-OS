const { Pool } = require('pg');

// This connects to the production database used by the Railway api-server
// The production DATABASE_URL references the internal Railway Postgres service
const pool = new Pool({ 
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

async function main() {
  // Check all users and their passwords
  const users = await pool.query("SELECT id, email, LEFT(password, 20) as pwd_preview, role FROM users ORDER BY created_at");
  console.log('All users in DB:');
  users.rows.forEach(u => console.log(` [${u.role}] ${u.email} - pwd starts with: ${u.pwd_preview}`));

  // Check if any user can login with common passwords by checking hash prefix
  // bcrypt hash of 'admin123' - $2b prefix is bcrypt
  const admin = users.rows.find(u => u.email === 'admin@octopus.ai');
  if (admin) {
    console.log('\nAdmin password hash preview:', admin.pwd_preview);
    if (admin.pwd_preview.startsWith('$2')) {
      console.log('✅ Password is bcrypt hashed');
    } else {
      console.log('⚠️ Password format may be different');
    }
  }
  process.exit(0);
}
main().catch(console.error);
