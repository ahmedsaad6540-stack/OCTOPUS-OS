const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway";
const pool = new Pool({ connectionString });

async function seed() {
  try {
    console.log("Connecting to database...");
    
    // 1. Get ALL users
    const userRes = await pool.query("SELECT id FROM users");
    const users = userRes.rows;
    
    console.log(`Found ${users.length} users. Seeding for all...`);

    for (const user of users) {
      const userId = user.id;

      // 2. Insert Affiliate Networks (Digistore24 and Amazon)
      await pool.query(`
        INSERT INTO affiliate_networks (user_id, network, display_name, affiliate_id, status)
        VALUES ($1, 'digistore24', 'Digistore24', 'octopuslabai4418', 'connected')
        ON CONFLICT DO NOTHING;
      `, [userId]);

      await pool.query(`
        INSERT INTO affiliate_networks (user_id, network, display_name, affiliate_id, status)
        VALUES ($1, 'amazon', 'Amazon Associates', 'octopuslabai4418-20', 'connected')
        ON CONFLICT DO NOTHING;
      `, [userId]);

      // Update if existed
      await pool.query(`UPDATE affiliate_networks SET status = 'connected', affiliate_id = 'octopuslabai4418' WHERE user_id = $1 AND network = 'digistore24'`, [userId]);
      await pool.query(`UPDATE affiliate_networks SET status = 'connected', affiliate_id = 'octopuslabai4418-20' WHERE user_id = $1 AND network = 'amazon'`, [userId]);

      // 3. Create Real Campaigns
      await pool.query(`
        INSERT INTO campaigns (user_id, name, product_name, product_url, platform, affiliate_network, status)
        VALUES ($1, 'Water Revolution USA - Real Campaign', 'US Water Revolution', 'https://uswaterrevolution.com/#aff=octopuslabai4418', 'all', 'digistore24', 'active')
        ON CONFLICT DO NOTHING;
      `, [userId]);

      await pool.query(`
        INSERT INTO campaigns (user_id, name, product_name, product_url, platform, affiliate_network, status)
        VALUES ($1, 'High Ticket Affiliate Offer 660957', 'Product 660957', 'https://www.digistore24.com/redir/660957/octopuslabai4418/', 'all', 'digistore24', 'active')
        ON CONFLICT DO NOTHING;
      `, [userId]);

      await pool.query(`
        INSERT INTO campaigns (user_id, name, product_name, product_url, platform, affiliate_network, status)
        VALUES ($1, 'Amazon Top Tech Gadgets 2026', 'Amazon Top Tech', 'https://amzn.to/example-link', 'youtube', 'amazon', 'active')
        ON CONFLICT DO NOTHING;
      `, [userId]);
    }

    console.log("Successfully seeded real campaigns and affiliate networks for all users!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed:", err);
    process.exit(1);
  }
}

seed();
