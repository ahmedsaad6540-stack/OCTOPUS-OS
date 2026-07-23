const https = require('https');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMGU5MjRhYS0xMzkzLTQ4YjktOWJhMS1hZmIzNTE4YjMyZTkiLCJlbWFpbCI6Im9jdG9wdXNAYWRtaW4uYWkiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDc0NDY4MSwiZXhwIjoxNzg1MzQ5NDgxfQ.hOkY0nbLYdWYGx1vMXlK0hcUhAG-koUICJgiO84Oe-M';
const HOST = 'api-server-production-4801.up.railway.app';

function apiCall(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      path: '/api' + path,
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('\n=== Testing authenticated endpoints ===\n');

  // Test /me
  const me = await apiCall('/auth/me');
  console.log('GET /auth/me:', me.status, JSON.stringify(me.data).slice(0, 100));

  // Test campaigns
  const campaigns = await apiCall('/campaigns');
  console.log('GET /campaigns:', campaigns.status, JSON.stringify(campaigns.data).slice(0, 150));

  // Test video jobs
  const jobs = await apiCall('/video-jobs');
  console.log('GET /video-jobs:', jobs.status, JSON.stringify(jobs.data).slice(0, 150));

  // Test agents
  const agents = await apiCall('/agents');
  console.log('GET /agents:', agents.status, JSON.stringify(agents.data).slice(0, 150));

  // Test social accounts
  const social = await apiCall('/social/accounts');
  console.log('GET /social/accounts:', social.status, JSON.stringify(social.data).slice(0, 150));

  // Create a real campaign via API
  console.log('\n=== Creating real campaigns via API ===\n');
  
  const campaign1 = await apiCall('/campaigns', 'POST', {
    name: 'Amazon Echo Spot - TikTok Campaign',
    productName: 'Amazon Echo Spot 2024',
    productUrl: 'https://www.amazon.eg?&linkCode=ll2&tag=octopusai-21&linkId=926cdcd4290cb2c6840504860cf2348f&ref_=as_li_ss_tl',
    platform: 'tiktok',
    affiliateNetwork: 'Amazon Associates',
    status: 'active',
    budget: 50.0,
    commission: 15.00
  });
  console.log('CREATE Amazon Campaign:', campaign1.status, JSON.stringify(campaign1.data).slice(0, 200));

  const campaign2 = await apiCall('/campaigns', 'POST', {
    name: 'Genius Wave - Digistore24 YouTube',
    productName: 'The Genius Wave',
    productUrl: 'https://www.digistore24.com/redir/660957/octopuslabai4418/',
    platform: 'youtube',
    affiliateNetwork: 'Digistore24',
    status: 'active',
    budget: 100.0,
    commission: 42.98
  });
  console.log('CREATE Digistore Campaign:', campaign2.status, JSON.stringify(campaign2.data).slice(0, 200));

  const campaign3 = await apiCall('/campaigns', 'POST', {
    name: 'Water Revolution - Facebook',
    productName: 'US Water Revolution',
    productUrl: 'https://uswaterrevolution.com/#aff=octopuslabai4418',
    platform: 'facebook',
    affiliateNetwork: 'custom',
    status: 'active',
    budget: 75.0,
    commission: 30.00
  });
  console.log('CREATE Water Campaign:', campaign3.status, JSON.stringify(campaign3.data).slice(0, 200));

  // Verify campaigns
  const verifyCampaigns = await apiCall('/campaigns');
  console.log('\nTotal campaigns now:', verifyCampaigns.data?.campaigns?.length || 0);

  process.exit(0);
}
main().catch(console.error);
