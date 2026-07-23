const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/railway' });

async function run() {
  try {
    const affiliateInsert = `
      INSERT INTO affiliate_networks (user_id, network, display_name, affiliate_id, tracking_id, status)
      VALUES 
        ($1, 'amazon', 'Amazon Associates', '', 'octopusai-21', 'connected'),
        ($1, 'digistore24', 'Digistore24', 'octopuslabai4418', '', 'connected')
    `;
    
    const octoUserRes = await pool.query("SELECT id FROM users WHERE email = 'octopuslabai@gmail.com'");
    if (octoUserRes.rows.length > 0) {
      const octoId = octoUserRes.rows[0].id;
      await pool.query(affiliateInsert, [octoId]);
      console.log("Successfully inserted Amazon and Digistore24 networks for octopuslabai@gmail.com");
    } else {
        const anyUserRes = await pool.query("SELECT id FROM users LIMIT 1");
        if(anyUserRes.rows.length > 0) {
            await pool.query(affiliateInsert, [anyUserRes.rows[0].id]);
            console.log("Successfully inserted Amazon and Digistore24 networks for user ID: " + anyUserRes.rows[0].id);
        } else {
            console.log("No users found");
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
