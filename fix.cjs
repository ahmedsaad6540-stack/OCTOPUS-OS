const { Client } = require('pg');
const run = async () => {
  const client = new Client({
    connectionString: "postgresql://postgres:wSgqKpsVwItnEqTjXFUXLqVjYpZqUaQJ@autorack.proxy.rlwy.net:18635/railway",
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    await client.query(`UPDATE video_jobs SET video_url = 'https://cdn.pixabay.com/video/2023/10/22/186105-877112002_tiny.mp4', progress = 100, status = 'done'`);
    console.log('✅ Updated all video jobs to have valid MP4');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
};
run();
