import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const NETWORKS = [
  { id: "amazon",      icon: "🛒", name: "Amazon Associates",  commission: "3-10%",   status: "connected", clicks: 1200, convs: 34, profit: "$342.00" },
  { id: "clickbank",   icon: "💰", name: "ClickBank",          commission: "50-75%",  status: "connected", clicks: 4500, convs: 189, profit: "$6,120.00" },
  { id: "digistore",   icon: "🏦", name: "Digistore24",        commission: "40-80%",  status: "connected", clicks: 2300, convs: 75, profit: "$2,890.00" },
  { id: "cj",          icon: "🔗", name: "CJ Affiliate",       commission: "5-30%",   status: "connected", clicks: 800, convs: 14, profit: "$450.00" },
  { id: "impact",      icon: "⚡", name: "Impact Radius",      commission: "5-25%",   status: "disconnected", clicks: 0, convs: 0, profit: "$0.00" },
  { id: "awin",        icon: "🌐", name: "Awin",               commission: "5-20%",   status: "disconnected", clicks: 0, convs: 0, profit: "$0.00" },
];

export function AffiliatesPage() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState("clickbank");
  const [networks, setNetworks] = useState(NETWORKS);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({
    clickbank: { "API Key": "••••••••••••••••••••", "Tracking ID / Tag": "ahmedsaad_cb" }
  });
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
    setTestMsg(network.status === "connected" ? "✅ API connection verified — last synced 2 min ago" : "❌ Disconnected — configure credentials");
    setTesting(false);
  };

  const fields = [
    ["API Key", "Enter API key", "password"],
    ["Tracking ID / Tag", selected === "amazon" ? "yourtag-20" : "Tracking Tag", "text"],
  ];

  return (
    <div className="flex h-full min-h-screen select-none font-sans" style={{ background: "#06020f" }}>
      {/* Left sidebar pane: Networks */}
      <div className="w-56 shrink-0 py-4 px-3 flex flex-col bg-black/20 border-r border-purple-950/60">
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400/40 px-3 py-2 font-heading">{t("aiProviders")}</div>
        <div className="space-y-1 overflow-y-auto mt-2">
          {networks.map(n => (
            <button key={n.id} onClick={() => setSelected(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selected === n.id ? "bg-purple-950/30 border border-purple-500/30 text-white font-bold" : "text-purple-300/70 hover:bg-purple-950/15"
              }`}>
              <span className="text-base">{n.icon}</span>
              <span className="flex-1 text-left truncate">{n.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.status === "connected" ? "bg-emerald-400 shadow-[0_0_5px_#10b981]" : "bg-gray-600"}`}></div>
            </button>
          ))}
        </div>
      </div>

      {/* Main panel workspace */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Network Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-pulse">{network.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white font-heading">{network.name}</h1>
              <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-purple-400/60">
                <span className={network.status === "connected" ? "text-emerald-400 font-bold" : "text-gray-500"}>
                  {network.status === "connected" ? `● ${t("active")}` : `○ ${t("disabled")}`}
                </span>
                <span>Commission scale: <span className="text-purple-300">{network.commission}</span></span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={testConn} disabled={testing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all font-mono">
              {testing ? t("testing") : `🧪 ${t("testConnection")}`}
            </button>
            <button onClick={connect}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                network.status === "connected" ? "bg-red-950/60 text-red-400 border border-red-500/20" : "gradient-purple text-white shadow-md glow-purple"
              }`}>
              {network.status === "connected" ? t("disconnect") : t("connect")}
            </button>
          </div>
        </div>

        {testMsg && (
          <div className={`px-4 py-3 rounded-lg text-xs font-semibold animate-fadeIn ${
            testMsg.includes("✅") ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20" : "bg-red-950/20 text-red-400 border border-red-500/20"
          }`}>
            {testMsg}
          </div>
        )}

        {/* Global profit stats card */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t("roi"), value: network.status === "connected" ? "+$420.00" : "$0.00", color: "text-emerald-400", desc: "Estimated net profit" },
            { label: t("totalRevenue"), value: network.status === "connected" ? network.profit : "$0.00", color: "text-white", desc: "Accumulated payout" },
            { label: t("conversions"), value: network.status === "connected" ? network.convs : "0", color: "text-white", desc: "Pixel track conversions" },
            { label: "Traffic Clicks", value: network.status === "connected" ? network.clicks : "0", color: "text-white", desc: "Redirect click rate" }
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-4 rounded-xl">
              <span className="text-[10px] text-purple-400/50 font-bold uppercase tracking-wider block mb-1">{stat.label}</span>
              <div className={`text-xl font-black ${stat.color} font-mono`}>{stat.value}</div>
              <span className="text-[9px] text-purple-500/40 mt-1 block">{stat.desc}</span>
            </div>
          ))}
        </div>

        {/* Settings API Inputs card */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">{t("saveCredentials")}</h3>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(([label, ph, type]) => (
              <div key={label} className="space-y-1">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">{label}</label>
                <input type={type} value={values[selected]?.[label] || ""}
                  onChange={e => setVal(label, e.target.value)} placeholder={ph}
                  className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 transition-all font-mono" />
              </div>
            ))}
          </div>
          <button className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple mt-5">
            {t("saveCredentials")}
          </button>
        </div>
      </div>
    </div>
  );
}
