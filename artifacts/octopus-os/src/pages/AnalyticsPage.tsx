import { useState } from "react";

const WEEKS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REVENUE = [420, 680, 510, 920, 840, 1240, 980];
const CLICKS = [1200, 1800, 1400, 2400, 2100, 3100, 2600];

const PLATFORMS = [
  { name: "TikTok", icon: "🎵", revenue: "$1,842", ctr: "4.2%", posts: 34, color: "#ff0050" },
  { name: "Instagram", icon: "📸", revenue: "$924", ctr: "2.8%", posts: 22, color: "#e1306c" },
  { name: "YouTube", icon: "▶️", revenue: "$680", ctr: "3.1%", posts: 8, color: "#ff0000" },
  { name: "Pinterest", icon: "📌", revenue: "$401", ctr: "5.4%", posts: 45, color: "#e60023" },
];

const maxRev = Math.max(...REVENUE);

export function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">📊 Analytics</h1>
          <p className="text-purple-400/60 text-xs mt-1">Revenue, CTR, ROI, Conversions</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#0d0920" }}>
          {["24h", "7d", "30d", "90d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === p ? "gradient-purple text-white" : "text-purple-400"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: "$5,847", delta: "+18.4%", icon: "💰", up: true },
          { label: "Total Clicks", value: "14,600", delta: "+12.1%", icon: "👆", up: true },
          { label: "Conversions", value: "312", delta: "+8.7%", icon: "✅", up: true },
          { label: "Avg ROI", value: "4.2x", delta: "+0.6x", icon: "📈", up: true },
        ].map(k => (
          <div key={k.label} className="card-os p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{k.icon}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${k.up ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>{k.delta}</span>
            </div>
            <div className="text-xl font-bold text-white">{k.value}</div>
            <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="col-span-2 card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-4">💰 Revenue — Last 7 Days</h3>
          <div className="flex items-end gap-2 h-32">
            {REVENUE.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-purple-400/60">${val}</span>
                <div className="w-full rounded-t-sm gradient-purple"
                  style={{ height: `${(val / maxRev) * 100}%`, minHeight: 4 }}></div>
                <span className="text-[9px] text-purple-400/60">{WEEKS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-4">🎯 By Platform</h3>
          <div className="space-y-3">
            {PLATFORMS.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{p.icon}</span>
                    <span className="text-xs text-white">{p.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{p.revenue}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(parseInt(p.revenue.replace(/\D/g,"")) / 2000) * 100}%`, background: p.color }}></div>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-purple-400/60">CTR: {p.ctr}</span>
                  <span className="text-[9px] text-purple-400/60">{p.posts} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clicks Chart */}
      <div className="card-os p-4">
        <h3 className="text-sm font-bold text-purple-300 mb-4">👆 Clicks — Last 7 Days</h3>
        <div className="flex items-end gap-2 h-20">
          {CLICKS.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm" style={{ height: `${(val / Math.max(...CLICKS)) * 100}%`, background: "rgba(139,92,246,0.4)", minHeight: 4 }}></div>
              <span className="text-[9px] text-purple-400/60">{WEEKS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
