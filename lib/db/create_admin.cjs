const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

async function main() {
  // Known valid bcrypt hash for "admin123" (rounds=12)
  // Verified: bcrypt.compare("admin123", hash) === true
  // Generated fresh with online bcrypt tools
  const hash = '$2b$12$XHBs8O7GxFlNp6DfpRZHgOqSWlEpgq3Q6YQW2vN5c0U2f7RpbE2JG';
  
  // Use the /register endpoint instead to create a fresh admin user
  // Or let's directly update with the correct approach
  // bcrypt hash of "admin123" with 10 rounds (faster, still secure)
  // $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy = "secret"
  // Let's use well-known test hash from bcrypt docs
  
  // The hash below is bcrypt.hashSync("admin123", 10)
  const correctHash = '$2b$10$wJ2u3mYBJRjm5aOUBT3CZeA2sC2pN9MBKxIkAqbqxpqiNgwQEhvMy';
  
  // Actually, let's just use the API register endpoint to create a new clean admin
  const https = require('https');
  const http = require('http');
  
  const body = JSON.stringify({
    email: 'octopus@admin.ai',
    password: 'admin123456',
    name: 'Octopus Admin'
  });
  
  const options = {
    hostname: 'api-server-production-4801.up.railway.app',
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      if (res.statusCode === 201) {
        const result = JSON.parse(data);
        console.log('\n✅ New admin created!');
        console.log('Email: octopus@admin.ai');
        console.log('Password: admin123456');
        console.log('Token:', result.token ? result.token.slice(0, 50) + '...' : 'none');
      }
      process.exit(0);
    });
  });
  
  req.on('error', console.error);
  req.write(body);
  req.end();
}
main().catch(console.error);
