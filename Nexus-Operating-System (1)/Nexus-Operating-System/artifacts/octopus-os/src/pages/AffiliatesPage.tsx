import { useState } from "react";

const NETWORKS = [
  { id: "amazon",      icon: "🛒", name: "Amazon Associates",  commission: "3-10%",   status: "disconnected" },
  { id: "clickbank",   icon: "💰", name: "ClickBank",          commission: "50-75%",  status: "disconnected" },
  { id: "digistore",   icon: "🏦", name: "Digistore24",        commission: "40-80%",  status: "disconnected" },
  { id: "cj",          icon: "🔗", name: "CJ Affiliate",       commission: "5-30%",   status: "disconnected" },
  { id: "impact",      icon: "⚡", name: "Impact Radius",      commission: "5-25%",   status: "disconnected" },
  { id: "awin",        icon: "🌐", name: "Awin",               commission: "5-20%",   status: "disconnected" },
  { id: "shareasale",  icon: "🤝", name: "ShareASale",         commission: "10-40%",  status: "disconnected" },
  { id: "rakuten",     icon: "🎌", name: "Rakuten Advertising",commission: "5-15%",   status: "disconnected" },
  { id: "partnerstack",icon: "📊", name: "PartnerStack",       commission: "15-30%",  status: "disconnected" },
  { id: "aliexpress",  icon: "🛍️", name: "AliExpress",         commission: "4-8%",    status: "disconnected" },
  { id: "temu",        icon: "🛒", name: "Temu Affiliate",     commission: "10-20%",  status: "disconnected" },
  { id: "ebay",        icon: "🏷️", name: "eBay Partner Network","commission": "3-6%", status: "disconnected" },
  { id: "bestbuy",     icon: "🔵", name: "Best Buy Affiliate", commission: "1-7%",    status: "disconnected" },
  { id: "shopify",     icon: "🟢", name: "Shopify Affiliates", commission: "20%",     status: "disconnected" },
  { id: "custom",      icon: "⚙️", name: "Custom Network",    commission: "Custom",  status: "disconnected" },
];

export function AffiliatesPage() {
  const [selected, setSelected] = useState("amazon");
  const [networks, setNetworks] = useState(NETWORKS);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  const network = networks.find(n => n.id === selected)!;

  const setVal = (field: string, val: string) => {
    setValues(v => ({ ...v, [selected]: { ...v[selected], [field]: val } }));
  };

  const connect = () => {
    setNetworks(ns => ns.map(n => n.id === selected ? { ...n, status: n.status === "connected" ? "disconnected" : "connected" } : n));
  };

  const testConn = async () => {
    setTesting(true); setTestMsg("");
    await new Promise(r => setTimeout(r, 1200));
    setTestMsg(network.status === "connected" ? "✅ API connected — last sync 2 min ago" : "❌ Not connected — add credentials first");
    setTesting(false);
  };

  const fields = [
    ["API Key", "Your affiliate API key", "password"],
    ["API Secret", "Secret key", "password"],
    ["Tracking ID / Tag", selected === "amazon" ? "yourname-20" : "TRACK123", "text"],
    ["Webhook URL", `https://yourdomain.com/webhook/${selected}`, "text"],
  ];

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#0a0614" }}>
      <div className="w-52 shrink-0 py-4 px-2 overflow-y-auto" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50 px-2 py-2">15 Networks</div>
        {networks.map(n => (
          <button key={n.id} onClick={() => setSelected(n.id)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium mb-0.5 transition-all ${selected === n.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}>
            <span className="text-sm">{n.icon}</span>
            <span className="flex-1 text-left text-[11px]">{n.name}</span>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.status === "connected" ? "bg-emerald-400" : "bg-gray-600"}`}></div>
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{network.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{network.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-xs ${network.status === "connected" ? "text-emerald-400" : "text-gray-500"}`}>
                  {network.status === "connected" ? "✅ Connected" : "⭕ Disconnected"}
                </span>
                <span className="text-xs text-purple-400/60">Commission: <span className="text-purple-300">{network.commission}</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={testConn} disabled={testing}
              className="px-3 py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-400/50">
              {testing ? "⟳ Testing..." : "🧪 Test API"}
            </button>
            <button onClick={connect}
              className={`px-4 py-2 rounded-lg text-xs font-semibold ${network.status === "connected" ? "bg-red-900/50 text-red-400 border border-red-500/30" : "gradient-purple text-white glow-purple"}`}>
              {network.status === "connected" ? "🔌 Disconnect" : "🔗 Connect"}
            </button>
          </div>
        </div>

        {testMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-xs ${testMsg.includes("✅") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-red-900/20 text-red-400 border border-red-500/20"}`}>
            {testMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {fields.map(([label, ph, type]) => (
            <div key={label}>
              <label className="text-xs text-purple-400 mb-1 block">{label}</label>
              <input type={type} value={values[selected]?.[label] || ""}
                onChange={e => setVal(label, e.target.value)}
                placeholder={ph}
                className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none"
                style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }} />
            </div>
          ))}
        </div>

        <button className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple mb-6">
          💾 Save Configuration
        </button>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[["Clicks", "—", "📊"], ["Conversions", "—", "✅"], ["Earnings", "$0.00", "💰"], ["Last Sync", "Never", "🔄"]].map(([label, val, icon]) => (
            <div key={label} className="card-os p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-sm font-bold text-white">{val}</div>
              <div className="text-[10px] text-purple-400/60">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
