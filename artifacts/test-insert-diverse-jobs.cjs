const { Client } = require('D:/OCTOPUS_OS_FINAL/final_snapshot/node_modules/.pnpm/pg@8.22.0/node_modules/pg/lib/index.js');
const { randomUUID } = require('crypto');

const client = new Client({
  connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway'
});

(async () => {
  await client.connect();
  const u = await client.query('SELECT id FROM users LIMIT 1');
  const userId = u.rows[0]?.id || null;
  console.log('Found userId:', userId);

  // First, let's delete the old stereotyped 15 jobs or update them so only rich styles show up or let's insert our 6 fresh ones right at the top
  const styles = [
    { tmpl: '🎨 3D Animated Cartoon & Motion Graphics', vc: 'Leo (3D Animated Character) | ElevenLabs Expressive Animation', hook: 'POV: You finally discovered the 3D AI animation setup going viral on TikTok...' },
    { tmpl: '📦 Pure Product Showcase & Zoom Demos (No Talking Head)', vc: 'Product Showcase B-Roll Mode | Studio Narrator (Ultra-Clean AI Pro)', hook: 'Stop scrolling! Look at this cinematic product zoom and feature comparison in 15s...' },
    { tmpl: '🎭 Charismatic Tech Reviewer (David)', vc: 'David (Charismatic Tech Presenter) | David (HeyGen Natural Tech)', hook: 'I tested 15 different wealth manifestation gadgets, and this one blew me away...' },
    { tmpl: '✨ Lifestyle Influencer & Vlogger (Sarah)', vc: 'Sarah (Lifestyle Influencer) | Sarah (HeyGen Casual Vlog)', hook: 'My daily morning routine changed forever when I added this 7-second audio...' },
    { tmpl: '👔 Executive Coach & Authority Presenter (Marcus)', vc: 'Marcus (Executive Authority Presenter) | Marcus (HeyGen Deep Executive)', hook: '3 financial principles billionaires use in 2026 that nobody talks about...' },
    { tmpl: '🧪 Animated Motion Guide (Maya v2)', vc: 'Maya (Animated Motion Guide) | Maya (ElevenLabs Vibrant Animation)', hook: 'Let us break down exactly how brainwave synchronization works step-by-step...' }
  ];

  for (let i = 0; i < styles.length; i++) {
    const s = styles[i];
    const q = `INSERT INTO video_jobs (id, user_id, product_name, platform, hook, script, template, voice, music, duration, status, progress, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`;
    await client.query(q, [
      randomUUID(),
      userId,
      'The Genius Wave & Wealth Manifestation v2',
      'YouTube Shorts',
      s.hook,
      s.hook + ' Check out the official link in bio to secure yours today!',
      s.tmpl,
      s.vc,
      i % 2 === 0 ? 'Trending Viral Beat' : 'Cinematic Ambient Flow',
      '30s',
      'rendering_video',
      35 + i * 5
    ]);
  }
  console.log('Successfully inserted 6 distinct multi-style live jobs right at the top of PostgreSQL!');
  await client.end();
})();
