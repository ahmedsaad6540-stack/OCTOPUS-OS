import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

const weeklyData = DAYS.map((day) => ({
  day,
  revenue: rand(50, 500),
  clicks: rand(200, 2000),
  conversions: rand(2, 30),
  impressions: rand(5000, 50000),
}));

const platformData = [
  { name: "TikTok", revenue: 1240, clicks: 8900, color: "#ec4899" },
  { name: "YouTube", revenue: 890, clicks: 4500, color: "#ef4444" },
  { name: "Instagram", revenue: 670, clicks: 3200, color: "#8b5cf6" },
  { name: "Pinterest", revenue: 420, clicks: 2100, color: "#f43f5e" },
  { name: "Facebook", revenue: 310, clicks: 1800, color: "#3b82f6" },
];

const pieData = [
  { name: "TikTok", value: 38, color: "#ec4899" },
  { name: "YouTube", value: 27, color: "#ef4444" },
  { name: "Instagram", value: 20, color: "#8b5cf6" },
  { name: "Pinterest", value: 10, color: "#f43f5e" },
  { name: "Facebook", value: 5, color: "#3b82f6" },
];

const monthlyData = Array.from({ length: 30 }, (_, i) => ({
  day: String(i + 1),
  revenue: rand(20, 800),
  clicks: rand(100, 3000),
}));

type Range = "7d" | "30d";

const KPIS = [
  { label: "Total Revenue", value: "$3,530", change: "+12.4%", up: true, icon: "💰" },
  { label: "Total Clicks", value: "20,500", change: "+8.2%", up: true, icon: "👆" },
  { label: "Conversions", value: "342", change: "+22.1%", up: true, icon: "✅" },
  { label: "Avg. ROI", value: "287%", change: "+4.5%", up: true, icon: "📈" },
  { label: "Cost per Click", value: "$0.08", change: "-3.2%", up: false, icon: "💸" },
  { label: "Conv. Rate", value: "1.67%", change: "+0.3%", up: true, icon: "🎯" },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const chartData = range === "7d" ? weeklyData : monthlyData;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">📊 Analytics</h1>
            <p className="text-purple-400 text-sm mt-1">Real-time performance across all campaigns & platforms</p>
          </div>
          <div className="flex bg-[#130d2a] border border-purple-900/40 rounded-xl p-1">
            {(["7d", "30d"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white" : "text-purple-500 hover:text-white"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-3 hover:border-purple-700/60 transition-colors">
              <p className="text-lg mb-1">{kpi.icon}</p>
              <p className="text-lg font-black text-white">{kpi.value}</p>
              <p className="text-[9px] text-purple-400 leading-tight">{kpi.label}</p>
              <p className={`text-[10px] font-mono mt-1 ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>{kpi.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-4">📈 Revenue Over Time</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1040" />
                <XAxis dataKey={range === "7d" ? "day" : "day"} stroke="#6b21a8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b21a8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#c4b5fd" }} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revG)" name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-4">👆 Clicks & Conversions</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1040" />
                <XAxis dataKey={range === "7d" ? "day" : "day"} stroke="#6b21a8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b21a8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#c4b5fd" }} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#a855f7" }} />
                <Bar dataKey="clicks" fill="#4f46e5" name="Clicks" radius={[2, 2, 0, 0]} />
                <Bar dataKey="conversions" fill="#7c3aed" name="Conversions" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 flex flex-col items-center">
            <h2 className="text-sm font-bold text-purple-300 mb-4 self-start">🥧 Traffic by Platform</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1 text-[10px] text-purple-300">
                  <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                  {entry.name} {entry.value}%
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-3">🏆 Platform Performance</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-purple-900/40">
                  {["Platform", "Revenue", "Clicks", "Trend"].map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-purple-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {platformData.sort((a, b) => b.revenue - a.revenue).map((p) => (
                  <tr key={p.name} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="font-semibold text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-emerald-400 font-bold">${p.revenue}</td>
                    <td className="py-2.5 px-2 text-purple-300">{p.clicks.toLocaleString()}</td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#0d0920] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.round((p.revenue / 1240) * 100)}%`,
                              background: p.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-purple-500">{Math.round((p.revenue / 1240) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
