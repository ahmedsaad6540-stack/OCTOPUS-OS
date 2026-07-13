import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const WEEKS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REVENUE = [420, 680, 510, 920, 840, 1240, 980];
const CLICKS = [1200, 1800, 1400, 2400, 2100, 3100, 2600];

const PLATFORMS = [
  { name: "TikTok", icon: "🎵", revenue: "$1,842", ctr: "4.2%", posts: 34, color: "#ff0050" },
  { name: "Instagram", icon: "📸", revenue: "$924", ctr: "2.8%", posts: 22, color: "#e1306c" },
  { name: "YouTube", icon: "▶️", revenue: "$680", ctr: "3.1%", posts: 8, color: "#ff0000" },
  { name: "Pinterest", icon: "📌", revenue: "$401", ctr: "5.4%", posts: 45, color: "#e60023" },
];

const LATENCY = [120, 145, 130, 168, 152, 210, 184]; // in ms
const TOKENS = [120, 180, 150, 220, 190, 310, 270]; // in thousands

const maxRev = Math.max(...REVENUE);

type Mode = "business" | "system";

export function AnalyticsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("7d");
  const [mode, setMode] = useState<Mode>("business");

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            📊 {t("analyticsTitle")}
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">{t("analyticsDesc")}</p>
        </div>
        
        {/* Period selection */}
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-purple-950">
          {["24h", "7d", "30d", "90d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p ? "gradient-purple text-white shadow-md" : "text-purple-400 hover:text-purple-300"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-black/40 border border-purple-950">
        <button onClick={() => setMode("business")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === "business" ? "gradient-purple text-white shadow-md" : "text-purple-400 hover:text-purple-300"
          }`}>
          {t("businessPerformance")}
        </button>
        <button onClick={() => setMode("system")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === "system" ? "gradient-purple text-white shadow-md" : "text-purple-400 hover:text-purple-300"
          }`}>
          {t("systemObservability")}
        </button>
      </div>

      {mode === "business" ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: t("totalRevenue"), value: "$5,847", delta: "+18.4%", icon: "💰", up: true },
              { label: t("totalClicks"), value: "14,600", delta: "+12.1%", icon: "👆", up: true },
              { label: t("conversions"), value: "312", delta: "+8.7%", icon: "✅", up: true },
              { label: t("avgRoi"), value: "4.2x", delta: "+0.6x", icon: "📈", up: true },
            ].map(k => (
              <div key={k.label} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    k.up ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-red-950/40 text-red-400 border border-red-500/20"
                  }`}>{k.delta}</span>
                </div>
                <div className="text-xl font-black text-white font-heading">{k.value}</div>
                <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">{t("revenue7d")}</h3>
              <div className="flex items-end gap-3 h-36 mt-4">
                {REVENUE.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-purple-400/60 font-mono">${val}</span>
                    <div className="w-full rounded-t-lg gradient-purple shadow-md glow-purple"
                      style={{ height: `${(val / maxRev) * 100}%`, minHeight: 6 }}></div>
                    <span className="text-[9px] text-purple-400/60 font-mono">{WEEKS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">{t("byPlacement")}</h3>
              <div className="space-y-4">
                {PLATFORMS.map(p => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.icon}</span>
                        <span className="text-xs font-semibold text-white">{p.name}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono">{p.revenue}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-purple-950 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(parseInt(p.revenue.replace(/\D/g,"")) / 2000) * 100}%`, background: p.color }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-purple-400/60 font-mono">
                      <span>CTR: {p.ctr}</span>
                      <span>{p.posts} posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clicks Chart */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">{t("clicks7d")}</h3>
            <div className="flex items-end gap-3 h-24 mt-4">
              {CLICKS.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-indigo-500/25 border border-indigo-500/20" 
                    style={{ height: `${(val / Math.max(...CLICKS)) * 100}%`, minHeight: 6 }}></div>
                  <span className="text-[9px] text-purple-400/60 font-mono">{WEEKS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* System Vitals KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: t("requestsToday"), value: "12,894 reqs", delta: "142 ms avg", icon: "🔮", up: true },
              { label: t("tokenConsumption"), value: "1.2M tokens", delta: "$4.49 spent", icon: "🪙", up: true },
              { label: t("cpuLoad"), value: "34.5%", icon: "🖥️", up: false },
              { label: t("memoryFootprint"), value: "4.2 GB / 8 GB", icon: "🧠", up: true },
            ].map((k, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                  {k.delta && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-950/40 text-purple-400 border border-purple-500/20 font-mono">
                      {k.delta}
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-white font-heading">{k.value}</div>
                <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tokens Chart */}
            <div className="lg:col-span-2 glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">{t("tokenConsumption")}</h3>
              <div className="flex items-end gap-3 h-36 mt-4">
                {TOKENS.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-purple-400/60 font-mono">{val}k</span>
                    <div className="w-full rounded-t-lg bg-pink-500/40 shadow-inner glow-pink"
                      style={{ height: `${(val / Math.max(...TOKENS)) * 100}%`, minHeight: 6 }}></div>
                    <span className="text-[9px] text-purple-400/60 font-mono">{WEEKS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency History */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">{t("latency7d")}</h3>
              <div className="flex items-end gap-3 h-36 mt-4">
                {LATENCY.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-purple-400/60 font-mono">{val}ms</span>
                    <div className="w-full rounded-t-lg bg-purple-500/40 glow-purple"
                      style={{ height: `${(val / Math.max(...LATENCY)) * 100}%`, minHeight: 6 }}></div>
                    <span className="text-[9px] text-purple-400/60 font-mono">{WEEKS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
