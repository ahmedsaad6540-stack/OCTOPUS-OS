import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface AffiliateNetwork {
  id?: string;
  network: string;
  displayName: string;
  apiKey: string;
  secretKey: string;
  trackingId: string;
  affiliateId: string;
  webhookUrl: string;
  status: string;
  totalEarnings: string;
}

const NETWORKS = [
  { id: "amazon", name: "Amazon Associates", icon: "🛒", desc: "World's largest affiliate program", color: "from-orange-900/30 to-amber-900/20" },
  { id: "clickbank", name: "ClickBank", icon: "💳", desc: "Digital products marketplace", color: "from-blue-900/30 to-indigo-900/20" },
  { id: "digistore24", name: "Digistore24", icon: "🔢", desc: "European digital marketplace", color: "from-teal-900/30 to-cyan-900/20" },
  { id: "cj", name: "CJ Affiliate", icon: "🌐", desc: "Commission Junction network", color: "from-indigo-900/30 to-blue-900/20" },
  { id: "impact", name: "Impact", icon: "⚡", desc: "Partnership automation", color: "from-violet-900/30 to-purple-900/20" },
  { id: "awin", name: "Awin", icon: "🏆", desc: "Global affiliate network", color: "from-green-900/30 to-teal-900/20" },
  { id: "shareasale", name: "ShareASale", icon: "🤝", desc: "Mid-size network", color: "from-purple-900/30 to-pink-900/20" },
  { id: "rakuten", name: "Rakuten", icon: "🇯🇵", desc: "Rakuten Advertising", color: "from-red-900/30 to-pink-900/20" },
  { id: "partnerstack", name: "PartnerStack", icon: "🤝", desc: "B2B SaaS affiliates", color: "from-emerald-900/30 to-green-900/20" },
  { id: "aliexpress", name: "AliExpress", icon: "🛍️", desc: "AliExpress affiliate", color: "from-red-900/30 to-orange-900/20" },
  { id: "temu", name: "Temu", icon: "🏷️", desc: "Temu affiliate program", color: "from-orange-900/30 to-red-900/20" },
  { id: "ebay", name: "eBay Partner", icon: "🏷️", desc: "eBay Partner Network", color: "from-blue-900/30 to-sky-900/20" },
  { id: "shopify", name: "Shopify Partners", icon: "🛍️", desc: "Shopify referral program", color: "from-green-900/30 to-emerald-900/20" },
  { id: "custom", name: "Custom Network", icon: "🔧", desc: "Your own network", color: "from-gray-900/30 to-slate-900/20" },
];

export function AffiliatePage() {
  const [networks, setNetworks] = useState<AffiliateNetwork[]>([]);
  const [editing, setEditing] = useState<AffiliateNetwork | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await api.get<{ networks: AffiliateNetwork[] }>("/affiliates");
      setNetworks(data.networks);
    } catch { /* silent */ }
  };

  useEffect(() => { void load(); }, []);

  const addNetwork = (n: (typeof NETWORKS)[0]) => {
    setEditing({
      network: n.id,
      displayName: n.name,
      apiKey: "",
      secretKey: "",
      trackingId: "",
      affiliateId: "",
      webhookUrl: "",
      status: "disconnected",
      totalEarnings: "0.00",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/affiliates/${editing.id}`, editing);
      } else {
        await api.post("/affiliates", editing);
      }
      setEditing(null);
      await load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/affiliates/${id}`);
      await load();
    } catch { /* silent */ }
  };

  const connected = new Set(networks.map((n) => n.network));
  const totalEarnings = networks.reduce((sum, n) => sum + parseFloat(n.totalEarnings ?? "0"), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">💰 Affiliate Networks</h1>
            <p className="text-purple-400 text-sm mt-1">
              {networks.length} connected · Total earnings: <span className="text-emerald-400 font-bold">${totalEarnings.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {networks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Connected Networks</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-purple-900/40">
                    <th className="text-left px-4 py-3 text-purple-500 font-semibold">Network</th>
                    <th className="text-left px-4 py-3 text-purple-500 font-semibold">Affiliate ID</th>
                    <th className="text-left px-4 py-3 text-purple-500 font-semibold">Tracking ID</th>
                    <th className="text-right px-4 py-3 text-purple-500 font-semibold">Earnings</th>
                    <th className="text-center px-4 py-3 text-purple-500 font-semibold">Status</th>
                    <th className="text-center px-4 py-3 text-purple-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {networks.map((n) => {
                    const networkDef = NETWORKS.find((x) => x.id === n.network);
                    return (
                      <tr key={n.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{networkDef?.icon ?? "🔗"}</span>
                            <span className="font-semibold text-white">{n.displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-purple-300 font-mono">{n.affiliateId || "—"}</td>
                        <td className="px-4 py-3 text-purple-300 font-mono">{n.trackingId || "—"}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">${parseFloat(n.totalEarnings ?? "0").toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                            n.status === "connected"
                              ? "text-emerald-400 border-emerald-800/40 bg-emerald-900/20"
                              : "text-gray-500 border-gray-800/30 bg-gray-900/20"
                          }`}>{n.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setEditing({ ...n })} className="text-[10px] bg-[#0d0920] text-purple-300 hover:text-white px-2 py-1 rounded border border-purple-800/30 hover:border-purple-600 transition-all">Edit</button>
                            <button onClick={() => void remove(n.id!)} className="text-[10px] bg-[#0d0920] text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-900/30 hover:border-red-700 transition-all">Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <h2 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Available Networks</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {NETWORKS.map((network) => {
            const isConnected = connected.has(network.id);
            return (
              <button
                key={network.id}
                onClick={() => !isConnected && addNetwork(network)}
                disabled={isConnected}
                className={`relative flex flex-col items-start gap-1.5 bg-gradient-to-br ${network.color} border rounded-xl p-4 text-left transition-all ${
                  isConnected
                    ? "border-emerald-800/40 opacity-70 cursor-default"
                    : "border-purple-900/40 hover:border-purple-700/60 cursor-pointer"
                }`}
              >
                {isConnected && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
                )}
                <span className="text-xl">{network.icon}</span>
                <p className="text-xs font-bold text-white">{network.name}</p>
                <p className="text-[10px] text-purple-500">{network.desc}</p>
                {isConnected && <span className="text-[10px] text-emerald-500 font-semibold">✓ Connected</span>}
              </button>
            );
          })}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#130d2a] border border-purple-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-base font-black text-white mb-5 flex items-center gap-2">
                <span>{NETWORKS.find(n => n.id === editing.network)?.icon}</span>
                Configure {editing.displayName}
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Affiliate ID", key: "affiliateId" as const, placeholder: "your-affiliate-id" },
                  { label: "API Key", key: "apiKey" as const, placeholder: "api_key..." },
                  { label: "Secret Key", key: "secretKey" as const, placeholder: "secret_key..." },
                  { label: "Tracking ID", key: "trackingId" as const, placeholder: "tracking-id-123" },
                  { label: "Webhook URL", key: "webhookUrl" as const, placeholder: "https://..." },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input
                      type={key.includes("Secret") || key.includes("Key") ? "password" : "text"}
                      value={editing[key]}
                      onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="disconnected">Disconnected</option>
                    <option value="connected">Connected</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => void save()} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm">
                  {saving ? "Saving..." : "Save"}
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
