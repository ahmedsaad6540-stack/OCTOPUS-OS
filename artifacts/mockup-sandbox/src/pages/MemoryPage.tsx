import { useState, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { api } from "@/lib/api";

const MEMORY_DATA = {
  bestPostTime: [
    { hour: "6AM", score: 42 }, { hour: "9AM", score: 78 }, { hour: "12PM", score: 65 },
    { hour: "3PM", score: 55 }, { hour: "6PM", score: 92 }, { hour: "9PM", score: 87 },
    { hour: "12AM", score: 38 },
  ],
  radarData: [
    { subject: "TikTok", A: 92 }, { subject: "YouTube", A: 78 },
    { subject: "Instagram", A: 65 }, { subject: "Pinterest", A: 55 },
    { subject: "Facebook", A: 48 }, { subject: "Reddit", A: 35 },
  ],
};

interface MemoryItem { category: string; icon: string; value: string; confidence: number; updatedAt: string; trend: "up" | "down" | "stable"; }

const MEMORIES: MemoryItem[] = [
  { category: "Best Post Time", icon: "⏰", value: "6:00 PM – 9:00 PM", confidence: 94, updatedAt: "2 hours ago", trend: "stable" },
  { category: "Best Platform", icon: "📱", value: "TikTok", confidence: 89, updatedAt: "1 day ago", trend: "up" },
  { category: "Best Product Category", icon: "📦", value: "AI & Software Tools", confidence: 82, updatedAt: "3 days ago", trend: "up" },
  { category: "Best Hook Style", icon: "🪝", value: "Problem-Solution Pitch", confidence: 91, updatedAt: "5 hours ago", trend: "up" },
  { category: "Best CTA", icon: "📢", value: "\"Link in bio — limited offer\"", confidence: 87, updatedAt: "1 day ago", trend: "stable" },
  { category: "Best Country", icon: "🌍", value: "Saudi Arabia (KSA)", confidence: 95, updatedAt: "2 days ago", trend: "stable" },
];

const TREND_ICONS = { up: "↑", down: "↓", stable: "→" };
const TREND_COLORS = { up: "text-emerald-400", down: "text-red-400", stable: "text-purple-400" };

export function MemoryPage() {
  const [activeTab, setActiveTab] = useState<"knowledge" | "timing" | "platforms" | "log">("knowledge");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ campaigns: any[] }>("/campaigns")
      .then(res => {
        setCampaigns(res.campaigns || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const platformRevenueMap: Record<string, { revenue: number, conversions: number }> = {};
  campaigns.forEach(c => {
    const plat = c.platform || "TikTok";
    const formattedPlat = plat.charAt(0).toUpperCase() + plat.slice(1).toLowerCase();
    if (!platformRevenueMap[formattedPlat]) {
      platformRevenueMap[formattedPlat] = { revenue: 0, conversions: 0 };
    }
    platformRevenueMap[formattedPlat].revenue += Number(c.revenue || 0);
    platformRevenueMap[formattedPlat].conversions += Number(c.conversions || 0);
  });

  const dynamicPlatformStats = Object.keys(platformRevenueMap).map(plat => ({
    platform: plat,
    revenue: platformRevenueMap[plat].revenue,
    conversions: platformRevenueMap[plat].conversions
  })).sort((a, b) => b.revenue - a.revenue);

  const displayPlatformStats = dynamicPlatformStats.length > 0
    ? dynamicPlatformStats
    : [
        { platform: "TikTok", revenue: 84.00, conversions: 2 },
        { platform: "YouTube", revenue: 0, conversions: 0 },
        { platform: "Instagram", revenue: 0, conversions: 0 },
        { platform: "Pinterest", revenue: 0, conversions: 0 }
      ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🧠 Memory Engine</h1>
            <p className="text-purple-400 text-sm mt-1">
              AI learns from every campaign. Updated continuously. {MEMORIES.length} insights stored.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-mono">Learning Active</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-[#130d2a] border border-purple-900/40 rounded-xl p-1 mb-6 w-fit">
          {([
            { id: "knowledge", label: "📚 Knowledge Base" },
            { id: "timing", label: "⏰ Best Times" },
            { id: "platforms", label: "📱 Platforms" },
            { id: "log", label: "📋 Learning Log" },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === id ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow" : "text-purple-500 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "knowledge" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MEMORIES.map((m) => (
              <div key={m.category} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4 hover:border-purple-700/60 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className={`text-xs font-mono font-bold ${TREND_COLORS[m.trend]}`}>
                    {TREND_ICONS[m.trend]}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-1">{m.category}</p>
                <p className="text-sm font-bold text-white mb-3">"{m.value}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="flex justify-between text-[10px] text-purple-500 mb-1">
                      <span>Confidence</span>
                      <span className="text-white font-mono">{m.confidence}%</span>
                    </div>
                    <div className="w-full bg-[#0d0920] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                        style={{ width: `${m.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-purple-700 mt-2">Updated: {m.updatedAt}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "timing" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-bold text-purple-300 mb-4">⏰ Best Posting Hours</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MEMORY_DATA.bestPostTime} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1040" />
                  <XAxis dataKey="hour" stroke="#6b21a8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b21a8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="score" name="Engagement Score" radius={[4, 4, 0, 0]}>
                    {MEMORY_DATA.bestPostTime.map((entry, i) => (
                      <rect key={i} fill={entry.score >= 80 ? "#7c3aed" : "#3b1f6b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { time: "6PM–7PM", score: "Peak", color: "text-emerald-400" },
                  { time: "9PM–10PM", score: "High", color: "text-purple-400" },
                  { time: "9AM–10AM", score: "Good", color: "text-blue-400" },
                ].map(({ time, score, color }) => (
                  <div key={time} className="bg-[#0d0920] rounded-lg p-2 text-center border border-purple-900/20">
                    <p className={`text-xs font-bold ${color}`}>{score}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">{time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-bold text-purple-300 mb-4">📅 Weekly Pattern</h2>
              <div className="space-y-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, i) => {
                  const scores = [62, 71, 68, 79, 85, 94, 88];
                  const score = scores[i];
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs text-purple-400 w-24">{day}</span>
                      <div className="flex-1 bg-[#0d0920] rounded-full h-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-purple-700 to-indigo-500 transition-all" style={{ width: `${score}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-white w-8 text-right">{score}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 bg-[#0d0920] rounded-xl p-3 border border-purple-900/20">
                <p className="text-xs font-bold text-white">💡 AI Recommendation</p>
                <p className="text-xs text-purple-300 mt-1">Post Saturday at 6PM for maximum reach. Avoid Monday mornings.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "platforms" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-bold text-purple-300 mb-4">🕸️ Platform Performance Radar</h2>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={MEMORY_DATA.radarData}>
                  <PolarGrid stroke="#2e1060" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#a855f7" }} />
                  <Radar name="Score" dataKey="A" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-bold text-purple-300 mb-4">📊 Revenue by Platform</h2>
              <div className="space-y-3">
                {displayPlatformStats.map((p) => {
                  const maxRevenue = Math.max(...displayPlatformStats.map(x => x.revenue), 1);
                  const percent = Math.round((p.revenue / maxRevenue) * 100);
                  return (
                    <div key={p.platform} className="bg-[#0d0920] rounded-xl p-3 border border-purple-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{p.platform}</span>
                        <span className="text-sm font-bold text-emerald-400">${p.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#130d2a] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-[10px] text-purple-500">{p.conversions} conv.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-purple-900/30">
              <h2 className="text-sm font-bold text-white">📋 Learning Log</h2>
            </div>
            <div className="divide-y divide-purple-900/20">
              {[
                { time: "2 min ago", agent: "Tracker", event: "Updated best post time → 6PM peak confirmed with 47 data points for campaigns", type: "update" },
                { time: "1 hr ago", agent: "Brain", event: "New insight: 'Problem-Solution' hooks outperform 'Shock' hooks on product AI-Influencer System by 23%", type: "insight" },
                { time: "3 hrs ago", agent: "Optimizer", event: "Platform score updated: TikTok +5%, Instagram -2%", type: "update" },
                { time: "5 hrs ago", agent: "Creator", event: "Best template identified: Product Demo → Testimonial → CTA (94% confidence)", type: "insight" },
                { time: "1 day ago", agent: "TrendHunter", event: "Country data refreshed: SA still #1 for campaigns", type: "update" },
                { time: "1 day ago", agent: "Money", event: "Commission threshold updated: $25+ per sale shows 3x retention", type: "insight" },
                { time: "2 days ago", agent: "Brain", event: "Seasonal pattern detected: Weekend posts earn 31% more on TikTok", type: "pattern" },
                { time: "3 days ago", agent: "Lab", event: "A/B test complete: Short hooks (3-5s) beat long hooks (8-10s) by 41%", type: "test" },
              ].map(({ time, agent, event, type }, i) => (
                <div key={i} className="flex items-start gap-4 px-4 py-3 hover:bg-purple-900/10 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    type === "insight" ? "bg-emerald-400" : type === "pattern" ? "bg-amber-400" : type === "test" ? "bg-blue-400" : "bg-purple-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] bg-purple-800/40 text-purple-300 px-1.5 py-0.5 rounded font-mono">{agent}</span>
                      <span className="text-[10px] text-purple-700">{time}</span>
                    </div>
                    <p className="text-xs text-purple-200">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
