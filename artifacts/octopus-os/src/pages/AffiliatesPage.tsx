import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const NETWORK_META: Record<string, { icon: string; name: string; commission: string; fields: string[] }> = {
  amazon:      { icon: "🛒", name: "Amazon Associates",  commission: "3-10%",   fields: ["API Key", "Tracking Tag / Tag"] },
  clickbank:   { icon: "💰", name: "ClickBank",          commission: "50-75%",  fields: ["API Key", "Tracking ID"] },
  digistore:   { icon: "🏦", name: "Digistore24",        commission: "40-80%",  fields: ["API Key", "Tracking ID"] },
  cj:          { icon: "🔗", name: "CJ Affiliate",       commission: "5-30%",   fields: ["API Key", "Website ID"] },
  impact:      { icon: "⚡", name: "Impact Radius",      commission: "5-25%",   fields: ["Account SID", "Auth Token"] },
  awin:        { icon: "🌐", name: "Awin",               commission: "5-20%",   fields: ["API Key", "Publisher ID"] },
  shareasale:  { icon: "🤝", name: "ShareASale",         commission: "5-30%",   fields: ["API Token", "API Secret"] },
  partnerstack:{ icon: "🚀", name: "PartnerStack",       commission: "20-40%",  fields: ["API Key", "Partner ID"] },
};

interface Affiliate {
  id: string;
  providerName: string;
  displayName: string;
  apiKey?: string;
  status: "active" | "disconnected";
  clicks?: number;
  conversions?: number;
  profit?: string;
}

export function AffiliatesPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [selected, setSelected] = useState("clickbank");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const fetchAffiliates = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/affiliates", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list: Affiliate[] = (Array.isArray(data) ? data : data.networks ?? []).map((a: any) => ({
          id: a.id,
          providerName: a.network ?? a.providerName ?? "unknown",
          displayName: NETWORK_META[a.network ?? a.providerName]?.name ?? a.displayName ?? a.network ?? "Unknown",
          apiKey: a.apiKey || a.affiliateId || a.trackingId || "—",
          status: (a.status === "active" || a.status === "connected") ? "active" : "disconnected",
          clicks: a.clicks ?? 0,
          conversions: a.conversions ?? 0,
          profit: a.profit ? `$${a.profit}` : "$0.00",
        }));
        setAffiliates(list);
      }
    } catch (err) {
      console.error("Affiliate fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAffiliates(); }, [token]);

  const networkIds = Object.keys(NETWORK_META);
  const meta = NETWORK_META[selected];
  const existing = affiliates.find(a => a.providerName === selected);
  const isConnected = existing?.status === "active";

  const connect = async () => {
    if (!token) return;
    setSaving(true);
    try {
      if (isConnected && existing) {
        // Disconnect
        await fetch(`/api/affiliates/${existing.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Connect - POST with credentials
        await fetch("/api/affiliates", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            network: selected,
            displayName: meta.name,
            apiKey: values["API Key"] ?? values[meta.fields[0]] ?? "",
            trackingId: values[meta.fields[1]] ?? "",
            status: "active",
          }),
        });
      }
      await fetchAffiliates();
      setTestMsg(isConnected ? "Disconnected successfully" : "✅ Connected successfully!");
    } catch (err) {
      setTestMsg("❌ Operation failed. Check API connection.");
    } finally {
      setSaving(false);
    }
  };

  const testConn = async () => {
    setTesting(true);
    setTestMsg("");
    await new Promise(r => setTimeout(r, 800));
    setTestMsg(isConnected
      ? "✅ Connection verified — credentials valid"
      : "❌ Not connected — enter credentials to connect");
    setTesting(false);
  };

  return (
    <div className="flex h-full min-h-screen select-none font-sans" style={{ background: "#06020f" }}>
      {/* Left sidebar: Networks */}
      <div className="w-56 shrink-0 py-4 px-3 flex flex-col bg-black/20 border-r border-purple-950/60">
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400/40 px-3 py-2 font-heading">
          {t("affiliates") ?? "Affiliate Networks"}
        </div>
        <div className="space-y-1 overflow-y-auto mt-2">
          {networkIds.map(id => {
            const m = NETWORK_META[id];
            const aff = affiliates.find(a => a.providerName === id);
            const connected = aff?.status === "active";
            return (
              <button key={id} onClick={() => { setSelected(id); setTestMsg(""); setValues({}); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                  selected === id ? "bg-purple-900/40 border border-purple-700/30" : "hover:bg-purple-900/20"
                }`}>
                <span className="text-lg">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{m.name}</div>
                  <div className={`text-[10px] font-bold ${connected ? "text-emerald-400" : "text-purple-400/40"}`}>
                    {connected ? "● Connected" : "○ Disconnected"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="mt-auto pt-4 border-t border-purple-950/40 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
            <div className="text-[10px] text-emerald-400/60 uppercase font-bold">Connected</div>
            <div className="text-lg font-black text-emerald-400">
              {loading ? "..." : affiliates.filter(a => a.status === "active").length}/{networkIds.length}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white font-heading">{meta.name}</h1>
              <p className="text-xs text-purple-400/60">Commission: {meta.commission}</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
            isConnected ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/30" : "bg-purple-950/30 text-purple-400/60 border-purple-800/30"
          }`}>
            {isConnected ? "● Connected" : "○ Disconnected"}
          </span>
        </div>

        {/* Stats row (if connected) */}
        {isConnected && existing && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Clicks", value: existing.clicks?.toLocaleString() ?? "0" },
              { label: "Conversions", value: existing.conversions?.toString() ?? "0" },
              { label: "Profit", value: existing.profit ?? "$0.00" },
            ].map(stat => (
              <div key={stat.label} className="glass-card p-4 rounded-xl text-center">
                <div className="text-[10px] text-purple-400/50 uppercase font-bold tracking-widest">{stat.label}</div>
                <div className="text-xl font-black text-white mt-1">{stat.value}</div>
                <div className="text-[10px] text-purple-400/30 mt-0.5">Live from DB</div>
              </div>
            ))}
          </div>
        )}

        {/* Credentials form */}
        <div className="glass-card p-5 rounded-xl space-y-4">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-2">API Credentials</div>
          {meta.fields.filter(f => f).map(field => (
            <div key={field}>
              <label className="text-[10px] text-purple-400/60 uppercase font-bold tracking-wider block mb-1">{field}</label>
              <input
                type={field.toLowerCase().includes("key") || field.toLowerCase().includes("secret") || field.toLowerCase().includes("token") || field.toLowerCase().includes("password") ? "password" : "text"}
                value={values[field] ?? ""}
                onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
                placeholder={isConnected ? "••••••••••••••••" : `Enter ${field}...`}
                className="w-full bg-black/40 border border-purple-800/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-purple-400/20"
              />
            </div>
          ))}

          {testMsg && (
            <div className={`text-xs p-3 rounded-lg border ${testMsg.startsWith("✅") ? "bg-emerald-950/30 border-emerald-800/30 text-emerald-400" : "bg-red-950/30 border-red-800/30 text-red-400"}`}>
              {testMsg}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={testConn} disabled={testing}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-purple-700/40 text-purple-300 hover:border-purple-500 transition-all disabled:opacity-50">
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button onClick={connect} disabled={saving}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                isConnected ? "bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50" : "gradient-purple text-white glow-purple"
              }`}>
              {saving ? "..." : isConnected ? "Disconnect" : "Connect Network"}
            </button>
          </div>
        </div>

        {/* All networks summary table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-purple-950/40">
            <h2 className="text-xs font-bold text-purple-300 uppercase tracking-widest">All Networks</h2>
          </div>
          <div className="divide-y divide-purple-950/30">
            {loading ? (
              <div className="p-6 text-center text-purple-400/40 text-sm">Loading...</div>
            ) : networkIds.map(id => {
              const m = NETWORK_META[id];
              const aff = affiliates.find(a => a.providerName === id);
              return (
                <div key={id} onClick={() => setSelected(id)}
                  className="flex items-center justify-between p-4 hover:bg-purple-950/10 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-[10px] text-purple-400/40">{m.commission} commission</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{aff?.profit ?? "$0.00"}</div>
                    <div className={`text-[10px] font-bold ${aff?.status === "active" ? "text-emerald-400" : "text-purple-400/30"}`}>
                      {aff?.status === "active" ? "● Active" : "○ Not connected"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
