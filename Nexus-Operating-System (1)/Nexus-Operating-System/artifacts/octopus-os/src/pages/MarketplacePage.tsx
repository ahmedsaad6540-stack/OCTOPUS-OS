import { useState } from "react";

const AGENTS = [
  { id: 1, name: "ViralHunter Pro", icon: "🔥", category: "Research", rating: 4.9, installs: 2341, price: "Free", installed: false, desc: "Finds viral trends before they peak — 48h early detection on TikTok & Instagram." },
  { id: 2, name: "AmazonSpy", icon: "🕵️", category: "Affiliate", rating: 4.8, installs: 1892, price: "$9/mo", installed: true, desc: "Monitors Amazon product rankings, price drops, and commission changes in real-time." },
  { id: 3, name: "ContentCloner", icon: "📋", category: "Creation", rating: 4.7, installs: 1543, price: "Free", installed: false, desc: "Analyzes your top competitors and generates similar but unique content." },
  { id: 4, name: "ROI Maximizer", icon: "📈", category: "Analytics", rating: 4.9, installs: 987, price: "$19/mo", installed: false, desc: "Uses ML to predict and optimize ROI across all affiliate networks." },
  { id: 5, name: "MultiPlatformPoster", icon: "🚀", category: "Publisher", rating: 4.6, installs: 3210, price: "Free", installed: true, desc: "One-click publishing to 15 platforms simultaneously with platform-specific optimization." },
  { id: 6, name: "EmojiOptimizer", icon: "😊", category: "Creation", rating: 4.5, installs: 876, price: "Free", installed: false, desc: "Adds the perfect emojis to maximize engagement on each platform." },
  { id: 7, name: "ClickBank Scanner", icon: "💰", category: "Affiliate", rating: 4.7, installs: 1234, price: "$14/mo", installed: false, desc: "Scans ClickBank gravity scores and identifies hot products before they saturate." },
  { id: 8, name: "CommentBot", icon: "💬", category: "Engagement", rating: 4.3, installs: 654, price: "Free", installed: false, desc: "Auto-replies to comments with AI-generated responses matching your brand voice." },
  { id: 9, name: "PinterestOptimizer", icon: "📌", category: "Publisher", rating: 4.8, installs: 543, price: "$7/mo", installed: false, desc: "Optimizes pins for maximum reach — board strategies, keyword stuffing, scheduling." },
  { id: 10, name: "TikTokSEO", icon: "🎵", category: "SEO", rating: 4.9, installs: 4521, price: "Free", installed: true, desc: "Generates viral hashtag sets, caption templates, and sound recommendations." },
  { id: 11, name: "RevenueForecaster", icon: "🔮", category: "Analytics", rating: 4.6, installs: 432, price: "$29/mo", installed: false, desc: "Forecasts monthly revenue with 87% accuracy using historical campaign data." },
  { id: 12, name: "LinkCloaker Pro", icon: "🔗", category: "Affiliate", rating: 4.4, installs: 1876, price: "$5/mo", installed: false, desc: "Cloaks, tracks, and A/B tests all affiliate links across campaigns." },
];

const CATS = ["All", "Research", "Affiliate", "Creation", "Analytics", "Publisher", "Engagement", "SEO"];

export function MarketplacePage() {
  const [agents, setAgents] = useState(AGENTS);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = agents.filter(a =>
    (cat === "All" || a.category === cat) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id: number) => {
    setAgents(as => as.map(a => a.id === id ? { ...a, installed: !a.installed } : a));
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🏪 AI Marketplace</h1>
        <p className="text-purple-400/60 text-xs mt-1">Install specialized agents · {agents.filter(a => a.installed).length} installed of {agents.length}</p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }} />
        <div className="flex gap-1 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cat === c ? "gradient-purple text-white" : "text-purple-400 hover:bg-purple-900/30"}`}
              style={cat !== c ? { background: "#0d0920", border: "1px solid rgba(139,92,246,0.15)" } : {}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map(a => (
          <div key={a.id} className="card-os p-4 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{a.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-yellow-400">★ {a.rating}</span>
                    <span className="text-[10px] text-purple-400/60">· {a.installs.toLocaleString()} installs</span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.price === "Free" ? "bg-emerald-900/50 text-emerald-400" : "bg-purple-900/50 text-purple-400"}`}>
                {a.price}
              </span>
            </div>
            <p className="text-xs text-purple-300/70 flex-1 mb-3 leading-relaxed">{a.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>{a.category}</span>
              <button onClick={() => toggle(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${a.installed ? "bg-red-900/40 text-red-400 border border-red-500/30" : "gradient-purple text-white"}`}>
                {a.installed ? "✗ Remove" : "+ Install"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
