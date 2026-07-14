import { useState } from "react";

interface MarketplaceAgent {
  id: string;
  name: string;
  icon: string;
  category: string;
  author: string;
  rating: number;
  installs: number;
  price: "free" | "pro" | number;
  desc: string;
  tags: string[];
  installed: boolean;
  featured?: boolean;
}

const AGENTS: MarketplaceAgent[] = [
  { id: "1", name: "SEO Master", icon: "🔍", category: "Marketing", author: "OCTOPUS Labs", rating: 4.9, installs: 1247, price: "pro", desc: "Advanced SEO analysis, keyword research, and content optimization for affiliate sites.", tags: ["SEO", "Keywords", "Ranking"], installed: false, featured: true },
  { id: "2", name: "Email Marketer", icon: "📧", category: "Marketing", author: "OCTOPUS Labs", rating: 4.7, installs: 892, price: "free", desc: "Automate email campaigns, sequences, and follow-ups for affiliate marketing.", tags: ["Email", "Automation", "CRM"], installed: false, featured: true },
  { id: "3", name: "WhatsApp Bot", icon: "💬", category: "Messaging", author: "Community", rating: 4.5, installs: 543, price: "free", desc: "Send automated WhatsApp messages, bulk campaigns, and bot responses.", tags: ["WhatsApp", "Messaging", "Bot"], installed: true },
  { id: "4", name: "Telegram Publisher", icon: "✈️", category: "Publishing", author: "Community", rating: 4.8, installs: 2341, price: "free", desc: "Publish to Telegram channels and groups automatically with rich media support.", tags: ["Telegram", "Publishing", "Bot"], installed: true },
  { id: "5", name: "Voice AI Creator", icon: "🎙️", category: "Content", author: "OCTOPUS Labs", rating: 4.6, installs: 678, price: 9.99, desc: "Create AI voiceovers in 50+ languages with realistic cloned voices.", tags: ["Voice", "Audio", "Multilingual"], installed: false, featured: true },
  { id: "6", name: "Pinterest Bot", icon: "📌", category: "Publishing", author: "Community", rating: 4.3, installs: 421, price: "free", desc: "Auto-create and schedule Pinterest pins for affiliate products.", tags: ["Pinterest", "Visual", "Scheduling"], installed: false },
  { id: "7", name: "Sales CRM", icon: "💼", category: "Business", author: "OCTOPUS Labs", rating: 4.8, installs: 334, price: "pro", desc: "Full CRM for tracking leads, follow-ups, and customer journey in affiliate sales.", tags: ["CRM", "Sales", "Leads"], installed: false },
  { id: "8", name: "Reddit Poster", icon: "🤖", category: "Publishing", author: "Community", rating: 4.1, installs: 289, price: "free", desc: "Intelligently post to relevant Reddit subreddits with anti-spam protection.", tags: ["Reddit", "Community", "Organic"], installed: false },
  { id: "9", name: "Price Tracker", icon: "🏷️", category: "Research", author: "Community", rating: 4.4, installs: 567, price: "free", desc: "Track competitor prices and Amazon deals. Alert when prices drop.", tags: ["Price", "Amazon", "Deals"], installed: false },
  { id: "10", name: "Influencer Finder", icon: "⭐", category: "Marketing", author: "OCTOPUS Labs", rating: 4.7, installs: 445, price: "pro", desc: "Find micro-influencers for collaboration with engagement rate analysis.", tags: ["Influencer", "Collab", "Social"], installed: false, featured: true },
  { id: "11", name: "PDF Generator", icon: "📄", category: "Content", author: "Community", rating: 4.2, installs: 234, price: "free", desc: "Create lead magnets, guides, and ebooks from your affiliate content.", tags: ["PDF", "Lead Magnet", "Content"], installed: false },
  { id: "12", name: "Discord Bot", icon: "🎮", category: "Community", author: "Community", rating: 4.6, installs: 789, price: "free", desc: "Run Discord community with auto-moderation and affiliate link sharing.", tags: ["Discord", "Community", "Bot"], installed: false },
];

const CATEGORIES = ["All", "Marketing", "Publishing", "Content", "Research", "Business", "Messaging", "Community"];

export function MarketplacePage() {
  const [agents, setAgents] = useState(AGENTS);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "installed" | "featured">("all");

  const install = async (id: string) => {
    setInstalling(id);
    await new Promise((r) => setTimeout(r, 1500));
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, installed: true } : a));
    setInstalling(null);
  };

  const uninstall = (id: string) => setAgents((prev) => prev.map((a) => a.id === id ? { ...a, installed: false } : a));

  const filtered = agents.filter((a) => {
    if (tab === "installed" && !a.installed) return false;
    if (tab === "featured" && !a.featured) return false;
    if (category !== "All" && a.category !== category) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const installedCount = agents.filter((a) => a.installed).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🏪 AI Marketplace</h1>
            <p className="text-purple-400 text-sm mt-1">
              {agents.length} agents available · {installedCount} installed
            </p>
          </div>
          <button className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
            + Publish Agent
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="flex-1 bg-[#130d2a] border border-purple-800/40 rounded-xl px-4 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-1 bg-[#130d2a] border border-purple-900/40 rounded-xl p-1">
            {([
              { id: "all", label: `All (${agents.length})` },
              { id: "featured", label: "⭐ Featured" },
              { id: "installed", label: `Installed (${installedCount})` },
            ] as const).map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === id ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white" : "text-purple-500 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${category === cat ? "bg-purple-700 text-white border-purple-600" : "bg-[#130d2a] text-purple-400 border-purple-800/30 hover:border-purple-600 hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <div key={agent.id} className={`bg-[#130d2a] border rounded-xl p-5 hover:border-purple-700/60 transition-colors relative ${agent.featured ? "border-purple-700/40" : "border-purple-900/40"}`}>
              {agent.featured && (
                <div className="absolute top-3 right-3 text-[9px] bg-amber-800/60 text-amber-300 border border-amber-700/40 px-1.5 py-0.5 rounded-full font-bold">
                  ⭐ Featured
                </div>
              )}
              {agent.installed && (
                <div className="absolute top-3 left-3 text-[9px] bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded-full font-bold">
                  ✓ Installed
                </div>
              )}
              <div className="flex items-center gap-3 mb-3 mt-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-800/60 to-indigo-800/40 border border-purple-700/30 flex items-center justify-center text-2xl flex-shrink-0">
                  {agent.icon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{agent.name}</h3>
                  <p className="text-[10px] text-purple-500">{agent.author} · {agent.category}</p>
                </div>
              </div>
              <p className="text-xs text-purple-300 mb-3 leading-relaxed">{agent.desc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.tags.map((tag) => (
                  <span key={tag} className="text-[9px] bg-purple-900/30 text-purple-400 border border-purple-800/20 px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400">★ {agent.rating}</span>
                  <span className="text-[10px] text-purple-600">{agent.installs.toLocaleString()} installs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${agent.price === "free" ? "text-emerald-400" : agent.price === "pro" ? "text-amber-400" : "text-white"}`}>
                    {agent.price === "free" ? "Free" : agent.price === "pro" ? "Pro" : `$${agent.price}/mo`}
                  </span>
                  {agent.installed ? (
                    <button onClick={() => uninstall(agent.id)} className="text-[10px] text-red-400 bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-900/30 hover:border-red-700 transition-all font-bold">
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => void install(agent.id)}
                      disabled={installing === agent.id}
                      className="text-[10px] bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition-all hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
                    >
                      {installing === agent.id ? "..." : "Install"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
