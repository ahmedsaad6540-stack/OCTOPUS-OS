import { useState } from "react";

interface Prompt {
  id: string;
  name: string;
  agent: string;
  category: string;
  content: string;
  lastModified: string;
  uses: number;
  rating: number;
}

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: "1", agent: "Brain", category: "Research", name: "Product Research Master",
    content: `You are OCTOPUS Brain — the master research agent. Your job is to find winning affiliate products.

Analyze the following criteria:
1. Market demand (Google Trends, TikTok search volume)
2. Competition level (low = better for beginners)
3. Commission rate (aim for 30%+ or $20+ per sale)
4. Product reviews (4+ stars, 100+ reviews)
5. Affiliate program reliability

Output a JSON with: productName, category, estimatedRevenue, difficulty, recommendation.`,
    lastModified: "2 hours ago", uses: 147, rating: 4.8,
  },
  {
    id: "2", agent: "Creator", category: "Content", name: "Viral Hook Generator",
    content: `You are OCTOPUS Creator. Generate 10 viral hooks for this product: {{product_name}}.

Rules:
- Hook must be under 5 seconds when read aloud
- Start with a controversial statement, question, or shocking fact
- Appeal to {{target_audience}} pain points
- End with curiosity gap to keep watching

Format: numbered list, one hook per line, no explanations.`,
    lastModified: "5 hours ago", uses: 89, rating: 4.9,
  },
  {
    id: "3", agent: "CEO", category: "Strategy", name: "Daily Briefing Generator",
    content: `You are the OCTOPUS AI CEO. Generate today's strategic briefing.

Available data:
- Revenue: {{revenue_today}}
- Active campaigns: {{campaign_count}}
- Top performing: {{top_campaign}}
- Alerts: {{alerts}}

Generate a concise morning briefing with:
1. Yesterday's performance summary
2. Today's top 3 priorities
3. One specific recommendation with reasoning
4. Any risks to watch

Tone: decisive, data-driven, under 200 words.`,
    lastModified: "1 day ago", uses: 52, rating: 4.7,
  },
  {
    id: "4", agent: "TrendHunter", category: "Research", name: "Trend Detection Scan",
    content: `You are OCTOPUS TrendHunter. Scan for emerging affiliate opportunities.

Current date: {{current_date}}
Platform: {{platform}}

Look for:
1. Products trending in last 48 hours
2. Hashtags with rapid growth (>50% weekly)
3. Creator content that's going viral with products
4. Search volume spikes on Google/YouTube

Output: JSON array of trends with {trend, platform, growthRate, opportunityScore (1-10), suggestedProduct}`,
    lastModified: "3 hours ago", uses: 203, rating: 4.6,
  },
];

const AGENTS = ["All", "Brain", "Creator", "Publisher", "Tracker", "Optimizer", "Money", "Competitor", "TrendHunter", "Lab", "CEO"];
const CATEGORIES = ["All", "Research", "Content", "Strategy", "Analysis", "Publishing"];

export function PromptStudioPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(DEFAULT_PROMPTS);
  const [selected, setSelected] = useState<Prompt | null>(prompts[0]);
  const [editingContent, setEditingContent] = useState(prompts[0]?.content ?? "");
  const [filterAgent, setFilterAgent] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const filtered = prompts.filter((p) => {
    if (filterAgent !== "All" && p.agent !== filterAgent) return false;
    if (filterCat !== "All" && p.category !== filterCat) return false;
    return true;
  });

  const selectPrompt = (p: Prompt) => {
    setSelected(p);
    setEditingContent(p.content);
    setTestOutput("");
  };

  const saveEdit = () => {
    if (!selected) return;
    setPrompts((prev) => prev.map((p) => p.id === selected.id ? { ...p, content: editingContent, lastModified: "just now" } : p));
    setSelected((s) => s ? { ...s, content: editingContent } : s);
  };

  const runTest = async () => {
    setTestLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTestOutput(`[OCTOPUS ${selected?.agent} — Simulated Output]

Based on your prompt template, here's a sample response:

${selected?.agent === "Creator" ? `1. "They said this product was too expensive... until they saw THIS 👀"
2. "POV: You found the exact thing I've been hiding from you for months"
3. "Watch me turn $20 into $200 using this one simple trick"
4. "Doctors don't want you to know about this product 🚨"
5. "I bought this with zero expectations... I was WRONG"` : selected?.agent === "Brain" ? `{
  "productName": "Premium Wireless Earbuds X200",
  "category": "Electronics",
  "estimatedRevenue": "$1,200/month",
  "difficulty": "Medium",
  "recommendation": "High potential — 45% commission, 4.7 stars, trending on TikTok"
}` : `Analysis complete. Confidence score: 94.2%

Key findings:
• Market opportunity: HIGH
• Recommended action: PROCEED
• Expected ROI: 285%
• Timeline to profitability: 2-3 weeks`}

[Tokens used: 847 | Latency: 1.2s | Model: GPT-4o]`);
    setTestLoading(false);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex">
      <div className="w-64 border-r border-purple-900/30 flex flex-col">
        <div className="p-4 border-b border-purple-900/30">
          <h2 className="text-sm font-black text-white mb-3">✍️ Prompt Studio</h2>
          <div className="space-y-2">
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/40 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
              {AGENTS.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/40 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPrompt(p)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${selected?.id === p.id ? "bg-purple-900/40 border border-purple-700/40" : "hover:bg-purple-900/20 border border-transparent"}`}
            >
              <p className="text-xs font-bold text-white truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] bg-purple-800/40 text-purple-300 px-1.5 py-0.5 rounded">{p.agent}</span>
                <span className="text-[9px] text-purple-600">{p.uses} uses</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-purple-900/30">
          <button className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-bold py-2 rounded-lg">
            + New Prompt
          </button>
        </div>
      </div>

      {selected && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">{selected.name}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] bg-purple-800/40 text-purple-300 px-2 py-0.5 rounded">{selected.agent}</span>
                <span className="text-[10px] text-purple-600">{selected.category}</span>
                <span className="text-[10px] text-purple-600">{selected.uses} uses</span>
                <span className="text-[10px] text-amber-400">★ {selected.rating}</span>
                <span className="text-[10px] text-purple-700">Modified: {selected.lastModified}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg">
                💾 Save
              </button>
              <button className="bg-[#130d2a] text-purple-300 text-xs font-bold px-4 py-2 rounded-lg border border-purple-800/40">
                📋 Duplicate
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <label className="text-xs font-semibold text-purple-400 mb-2">Prompt Template</label>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="flex-1 bg-[#0d0920] border border-purple-800/40 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-purple-500 resize-none"
              />
              <p className="text-[10px] text-purple-700 mt-2">
                Use {"{{variable}}"} for dynamic values. Available: {"{{product_name}}"}, {"{{platform}}"}, {"{{target_audience}}"}, {"{{current_date}}"}
              </p>
            </div>

            <div className="w-72 border-l border-purple-900/30 flex flex-col p-4">
              <label className="text-xs font-semibold text-purple-400 mb-2">🧪 Test Prompt</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Variable values for testing..."
                rows={3}
                className="bg-[#0d0920] border border-purple-800/40 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-purple-500 resize-none mb-3"
              />
              <button onClick={() => void runTest()} disabled={testLoading} className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold py-2 rounded-lg mb-3">
                {testLoading ? "Running..." : "▶ Run Test"}
              </button>
              {testOutput && (
                <>
                  <label className="text-xs font-semibold text-purple-400 mb-2">Output</label>
                  <div className="flex-1 bg-[#0d0920] border border-purple-800/40 rounded-xl p-3 text-[10px] text-emerald-300 font-mono overflow-y-auto whitespace-pre-wrap">
                    {testOutput}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
