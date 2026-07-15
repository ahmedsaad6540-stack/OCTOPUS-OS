// Seed script: creates initial agents + AI providers in Railway PostgreSQL via the real API
// Run: node scripts/seed-production.mjs

const BASE = "https://api-server-production-4801.up.railway.app/api";

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@octopus.ai", password: "octopus123" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Login failed: " + JSON.stringify(data));
  console.log("✅ Logged in as", data.user.name);
  return data.token;
}

async function post(token, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.warn(`  ⚠️ POST ${path} → ${res.status}:`, data.message ?? data.error ?? "unknown error");
    return null;
  }
  return data;
}

async function get(token, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function main() {
  const token = await login();

  // ── 1. Check existing agents ──────────────────────────────────────────────
  const { agents: existingAgents } = await get(token, "/agents");
  console.log(`\n📋 Existing agents: ${existingAgents.length}`);

  if (existingAgents.length === 0) {
    console.log("\n🤖 Seeding agents...");
    const AGENTS = [
      { name: "Brain",       description: "Master coordinator — analyzes products and orchestrates all other agents", instructions: "You are the Brain agent. Analyze incoming product data, identify opportunities, and coordinate other agents to maximize revenue.", capabilities: ["analysis", "coordination", "planning"] },
      { name: "TrendHunter", description: "Scans social media for viral products and trends", instructions: "You are TrendHunter. Monitor TikTok, Instagram, and Pinterest for trending products in Health, Beauty, and Tech niches. Report top 3 daily.", capabilities: ["web-search", "trend-analysis"] },
      { name: "Creator",     description: "Generates video scripts, hooks, and ad copy", instructions: "You are the Creator agent. Generate compelling short-form video scripts and ad copy based on Brain's product analysis.", capabilities: ["content-generation", "copywriting"] },
      { name: "Publisher",   description: "Posts content across TikTok, YouTube, Instagram, Pinterest", instructions: "You are the Publisher agent. Schedule and post content to all connected social platforms at optimal times.", capabilities: ["social-media", "scheduling"] },
      { name: "Tracker",     description: "Monitors affiliate links and click performance", instructions: "You are the Tracker agent. Monitor all affiliate links, track clicks, conversions, and revenue in real time.", capabilities: ["analytics", "tracking"] },
      { name: "Optimizer",   description: "Runs A/B tests and optimizes campaigns for ROI", instructions: "You are the Optimizer agent. Run A/B tests on hooks and ad copy. Kill underperformers and scale winners automatically.", capabilities: ["optimization", "ab-testing"] },
      { name: "Money",       description: "Processes revenue, commissions, and financial reporting", instructions: "You are the Money agent. Track all revenue streams, calculate commissions, and generate daily financial reports.", capabilities: ["finance", "reporting"] },
      { name: "Competitor",  description: "Monitors competitor strategies and pricing", instructions: "You are the Competitor agent. Monitor top competitors' products, pricing, and marketing strategies. Report key changes daily.", capabilities: ["research", "competitive-analysis"] },
      { name: "Lab",         description: "Tests new hooks, formats, and content experiments", instructions: "You are the Lab agent. Design and run content experiments. Track what hooks go viral and feed learnings back to Creator.", capabilities: ["experimentation", "research"] },
      { name: "CEO",         description: "Synthesizes all agent reports into executive briefings", instructions: "You are the CEO agent. Every morning synthesize reports from all agents into a concise executive briefing with top priorities and revenue forecast.", capabilities: ["synthesis", "reporting", "strategy"] },
    ];

    for (const agent of AGENTS) {
      const result = await post(token, "/agents", { ...agent, status: "active" });
      if (result) console.log(`  ✅ Created agent: ${agent.name} (id: ${result.agent?.id ?? "?"})`);
    }
  } else {
    console.log("  ↩️  Agents already exist, skipping.");
  }

  // ── 2. Check existing provider configs ──────────────────────────────────
  const { providers: existingProviders } = await get(token, "/providers");
  console.log(`\n📋 Existing providers: ${existingProviders.length}`);

  if (existingProviders.length === 0) {
    console.log("\n🧠 Seeding AI provider configs...");
    const PROVIDERS = [
      { name: "OpenAI",   providerType: "openai",    model: "gpt-4o",           apiKeyEnvVar: "OPENAI_API_KEY",   priority: 1, isEnabled: true  },
      { name: "Gemini",   providerType: "gemini",    model: "gemini-1.5-pro",   apiKeyEnvVar: "GEMINI_API_KEY",   priority: 2, isEnabled: true  },
      { name: "Claude",   providerType: "anthropic", model: "claude-3-5-sonnet", apiKeyEnvVar: "ANTHROPIC_API_KEY", priority: 3, isEnabled: false },
      { name: "DeepSeek", providerType: "openai",    model: "deepseek-chat",    apiKeyEnvVar: "DEEPSEEK_API_KEY", priority: 4, isEnabled: true  },
    ];

    for (const provider of PROVIDERS) {
      const result = await post(token, "/provider-configs", provider);
      if (result) console.log(`  ✅ Created provider: ${provider.name}`);
    }
  } else {
    console.log("  ↩️  Providers already exist, skipping.");
  }

  // ── 3. Final summary ─────────────────────────────────────────────────────
  const { agents: finalAgents } = await get(token, "/agents");
  const { providers: finalProviders } = await get(token, "/providers");
  console.log(`\n✅ Done! DB now has ${finalAgents.length} agents and ${finalProviders.length} providers.`);
}

main().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
