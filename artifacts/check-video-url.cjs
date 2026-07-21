const { Client } = require('D:/OCTOPUS_OS_FINAL/final_snapshot/node_modules/.pnpm/pg@8.22.0/node_modules/pg/lib/index.js');
const client = new Client({
  connectionString: 'postgresql://postgres:REDACTED@localhost:5432/octopus_test'
});

(async () => {
  await client.connect();
  const res = await client.query("SELECT id, template, voice, video_url FROM video_jobs WHERE id = '3a7ea574-1b35-4e64-a656-50ddf2e2ddc1'");
  console.log('Row:', res.rows[0]);
  await client.end();

  if (res.rows[0]?.video_url) {
    const url = res.rows[0].video_url;
    console.log('Testing fetch for URL:', url);
    try {
      const f = await fetch(url, { method: 'HEAD' });
      console.log('HTTP Status:', f.status, 'Content-Type:', f.headers.get('content-type'));
    } catch (err) {
      console.error('Fetch failed:', err.message);
    }
  }
})();
