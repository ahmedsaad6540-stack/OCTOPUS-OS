import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Campaign {
  id?: string;
  name: string;
  productName: string;
  productUrl: string;
  platform: string;
  affiliateNetwork: string;
  status: string;
  budget: number;
  spent: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  commission: number;
  notes: string;
  createdAt?: string;
}

const PLATFORMS = ["tiktok", "youtube", "instagram", "facebook", "x", "pinterest", "reddit", "linkedin"];
const NETWORKS = ["amazon", "clickbank", "digistore24", "cj", "impact", "awin", "shareasale", "custom"];

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 border-emerald-800/40 bg-emerald-900/20",
  paused: "text-amber-400 border-amber-800/40 bg-amber-900/20",
  stopped: "text-red-400 border-red-800/40 bg-red-900/20",
  draft: "text-gray-400 border-gray-800/30 bg-gray-900/20",
  completed: "text-blue-400 border-blue-800/40 bg-blue-900/20",
};

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵", youtube: "▶️", instagram: "📸", facebook: "👥",
  x: "✖️", pinterest: "📌", reddit: "🤖", linkedin: "💼",
};

const EMPTY_CAMPAIGN: Campaign = {
  name: "", productName: "", productUrl: "", platform: "tiktok",
  affiliateNetwork: "amazon", status: "draft", budget: 0, spent: 0,
  revenue: 0, conversions: 0, clicks: 0, impressions: 0, commission: 0, notes: "",
};

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");

  const load = async () => {
    try {
      const data = await api.get<{ campaigns: Campaign[] }>("/campaigns");
      setCampaigns(data.campaigns);
    } catch { /* silent */ }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/campaigns/${editing.id}`, editing);
      } else {
        await api.post("/campaigns", editing);
      }
      setEditing(null);
      await load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/campaigns/${id}`);
      await load();
    } catch { /* silent */ }
  };

  const toggleStatus = async (c: Campaign) => {
    const next = c.status === "active" ? "paused" : "active";
    try {
      await api.put(`/campaigns/${c.id}`, { ...c, status: next });
      await load();
    } catch { /* silent */ }
  };

  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks ?? 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">📣 Campaigns</h1>
            <p className="text-purple-400 text-sm mt-1">
              {campaigns.length} campaigns · {activeCampaigns} active · ${totalRevenue.toFixed(2)} earned · {totalClicks.toLocaleString()} clicks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#130d2a] border border-purple-900/40 rounded-lg p-1">
              {(["grid", "table"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${view === v ? "bg-purple-800 text-white" : "text-purple-500 hover:text-white"}`}>
                  {v === "grid" ? "⊞" : "☰"}
                </button>
              ))}
            </div>
            <button onClick={() => setEditing({ ...EMPTY_CAMPAIGN })} className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
              + New Campaign
            </button>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#130d2a] border border-purple-900/40 rounded-xl text-center">
            <span className="text-5xl mb-3">📭</span>
            <h3 className="text-white font-bold mb-1">No campaigns yet</h3>
            <p className="text-sm text-purple-500 mb-4">Create your first campaign to start earning</p>
            <button onClick={() => setEditing({ ...EMPTY_CAMPAIGN })} className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
              + Create Campaign
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4 hover:border-purple-700/60 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{PLATFORM_ICONS[c.platform] ?? "📣"}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{c.name}</p>
                      <p className="text-[10px] text-purple-500">{c.productName}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.draft}`}>
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#0d0920] rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-emerald-400">${(c.revenue ?? 0).toFixed(2)}</p>
                    <p className="text-[9px] text-purple-600">Revenue</p>
                  </div>
                  <div className="bg-[#0d0920] rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{(c.clicks ?? 0).toLocaleString()}</p>
                    <p className="text-[9px] text-purple-600">Clicks</p>
                  </div>
                  <div className="bg-[#0d0920] rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{c.conversions ?? 0}</p>
                    <p className="text-[9px] text-purple-600">Conv.</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => void toggleStatus(c)} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                    c.status === "active"
                      ? "text-amber-400 border-amber-800/40 hover:bg-amber-900/20"
                      : "text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/20"
                  }`}>
                    {c.status === "active" ? "⏸ Pause" : "▶ Activate"}
                  </button>
                  <button onClick={() => setEditing({ ...c })} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-purple-800/30 text-purple-400 hover:text-white hover:border-purple-600 transition-all">
                    Edit
                  </button>
                  <button onClick={() => void remove(c.id!)} className="text-[10px] font-bold py-1.5 px-2 rounded-lg border border-red-900/30 text-red-400 hover:border-red-700 transition-all">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-purple-900/40">
                  {["Campaign", "Platform", "Status", "Revenue", "Clicks", "Conv.", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-purple-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-[10px] text-purple-600">{c.productName}</p>
                    </td>
                    <td className="px-4 py-3">{PLATFORM_ICONS[c.platform]} {c.platform}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.draft}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">${(c.revenue ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-purple-300">{(c.clicks ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-purple-300">{c.conversions ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...c })} className="text-[10px] text-purple-400 hover:text-white bg-purple-900/20 px-2 py-1 rounded">Edit</button>
                        <button onClick={() => void remove(c.id!)} className="text-[10px] text-red-400 bg-red-900/10 px-2 py-1 rounded">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#130d2a] border border-purple-800/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-black text-white mb-5">{editing.id ? "✏️ Edit Campaign" : "📣 New Campaign"}</h2>
              <div className="space-y-3">
                {[
                  { label: "Campaign Name", key: "name" as const, placeholder: "Summer Sale 2025" },
                  { label: "Product Name", key: "productName" as const, placeholder: "Amazing Product" },
                  { label: "Product URL / Affiliate Link", key: "productUrl" as const, placeholder: "https://..." },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input
                      type="text"
                      value={String(editing[key])}
                      onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1">Platform</label>
                    <select value={editing.platform} onChange={(e) => setEditing({ ...editing, platform: e.target.value })} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                      {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1">Network</label>
                    <select value={editing.affiliateNetwork} onChange={(e) => setEditing({ ...editing, affiliateNetwork: e.target.value })} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                      {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1">Status</label>
                    <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                      {["draft", "active", "paused", "stopped", "completed"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1">Budget ($)</label>
                    <input type="number" value={editing.budget} onChange={(e) => setEditing({ ...editing, budget: Number(e.target.value) })} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1">Notes</label>
                  <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 resize-none" placeholder="Optional notes..." />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => void save()} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm">
                  {saving ? "Saving..." : editing.id ? "Update" : "Create Campaign"}
                </button>
                <button onClick={() => setEditing(null)} className="flex-1 bg-[#0d0920] text-purple-300 font-bold py-2.5 rounded-xl text-sm border border-purple-800/40">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
