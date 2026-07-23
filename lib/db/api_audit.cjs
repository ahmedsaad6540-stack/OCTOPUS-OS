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
        catch { resolve({ status: res.statusCode, data: data.slice(0, 100) }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  const endpoints = [
    '/dashboard/stats',
    '/tasks',
    '/scheduled-jobs',
    '/system/status',
    '/autonomous/status',
    '/production/jobs',
    '/social',
    '/affiliates',
    '/agents',
    '/analytics/summary',
    '/profit-engine/status',
    '/campaigns',
  ];

  console.log('=== Production API Endpoint Audit ===\n');
  for (const ep of endpoints) {
    const r = await apiCall(ep);
    const ok = r.status === 200 ? '✅' : r.status === 404 ? '❌ 404' : `⚠️ ${r.status}`;
    const preview = typeof r.data === 'object' ? JSON.stringify(r.data).slice(0, 80) : r.data.slice(0, 80);
    console.log(`${ok} GET ${ep} → ${preview}`);
  }
  process.exit(0);
}
main().catch(console.error);
