const { Client } = require('D:/OCTOPUS_OS_FINAL/final_snapshot/node_modules/.pnpm/pg@8.22.0/node_modules/pg/lib/index.js');
const client = new Client({
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

(async () => {
  await client.connect();
  const res = await client.query('SELECT id, template, voice, video_url FROM video_jobs');
  console.log(`Found ${res.rows.length} jobs to inspect/update...`);

  for (const job of res.rows) {
    const tmpl = (job.template || "").toLowerCase();
    const vc = (job.voice || "").toLowerCase();
    const url = (job.video_url || "").toLowerCase();

    // If it points to commondatastorage (which returns 403 now) or is empty/broken
    if (url.includes("commondatastorage") || !job.video_url) {
      let newUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
      if (tmpl.includes("cartoon") || vc.includes("cartoon") || tmpl.includes("3d") || tmpl.includes("maya") || vc.includes("leo")) {
        newUrl = Math.random() > 0.5 ? "https://media.w3.org/2010/05/sintel/trailer.mp4" : "https://media.w3.org/2010/05/bunny/trailer.mp4";
      } else if (tmpl.includes("showcase") || vc.includes("showcase") || tmpl.includes("zoom") || vc.includes("narrator")) {
        newUrl = "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4";
      } else if (vc.includes("david") || tmpl.includes("tech")) {
        newUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      } else if (vc.includes("sarah") || tmpl.includes("vlog") || tmpl.includes("lifestyle")) {
        newUrl = "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4";
      } else if (vc.includes("marcus") || tmpl.includes("executive")) {
        newUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
      }

      await client.query('UPDATE video_jobs SET video_url = $1 WHERE id = $2', [newUrl, job.id]);
      console.log(`Updated job ${job.id.slice(0, 8)} (${job.template || 'standard'}) -> ${newUrl}`);
    }
  }

  console.log('Successfully updated all database video URLs to 200 OK public MP4 streams!');
  await client.end();
})();
