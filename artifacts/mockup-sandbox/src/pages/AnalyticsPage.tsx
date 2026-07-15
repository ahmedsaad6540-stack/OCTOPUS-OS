import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  platform: string;
  network: string;
  status: string;
  budget?: string | number | null;
  clicks?: string | number | null;
  conversions?: string | number | null;
  revenue?: string | number | null;
  createdAt: string;
}

interface DashboardMetrics {
  revenue: number;
  clicks: number;
  sales: number;
}

interface ChartPoint {
  day: string;
  revenue: number;
  clicks: number;
  conversions: number;
}

interface PlatformStat {
  name: string;
  revenue: number;
  clicks: number;
  color: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#ec4899", youtube: "#ef4444", instagram: "#8b5cf6",
  pinterest: "#f43f5e", facebook: "#3b82f6", x: "#06b6d4",
  reddit: "#f97316", linkedin: "#0ea5e9",
};

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type Range = "7d" | "30d";

export function AnalyticsPage() {
  const [range, setRange]         = useState<Range>("7d");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics]     = useState<DashboardMetrics | null>(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Load real data ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [campData, metricsData] = await Promise.all([
        api.get<{ campaigns: Campaign[] }>("/campaigns"),
        api.get<{ metrics: DashboardMetrics }>("/profit-engine/dashboard").catch(() => ({ metrics: null })),
      ]);
      setCampaigns(campData.campaigns ?? []);
      setMetrics((metricsData as { metrics: DashboardMetrics | null }).metrics);
      setLastUpdated(new Date());
    } catch { /* silent — show zeros */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Derived aggregates from real campaign data ─────────────────────────────
  const totalRevenue    = metrics?.revenue ?? campaigns.reduce((s, c) => s + Number(c.revenue ?? 0), 0);
  const totalClicks     = metrics?.clicks  ?? campaigns.reduce((s, c) => s + Number(c.clicks ?? 0), 0);
  const totalConversions = metrics?.sales  ?? campaigns.reduce((s, c) => s + Number(c.conversions ?? 0), 0);
  const totalBudget     = campaigns.reduce((s, c) => s + Number(c.budget ?? 0), 0);
  const avgROI          = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget * 100).toFixed(1) : "0";
  const cpc             = totalClicks > 0 ? (totalRevenue / totalClicks).toFixed(4) : "0";
  const convRate        = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0";

  const KPIS = [
    { label: "إجمالي الإيراد",   value: `$${totalRevenue.toFixed(2)}`,   icon: "💰", color: "text-emerald-400" },
    { label: "إجمالي النقرات",    value: totalClicks.toLocaleString(),     icon: "👆", color: "text-blue-400" },
    { label: "التحويلات",         value: totalConversions.toString(),       icon: "✅", color: "text-purple-400" },
    { label: "متوسط ROI",        value: `${avgROI}%`,                      icon: "📈", color: "text-amber-400" },
    { label: "تكلفة النقرة",     value: `$${cpc}`,                         icon: "💸", color: "text-pink-400" },
    { label: "معدل التحويل",     value: `${convRate}%`,                    icon: "🎯", color: "text-cyan-400" },
  ];

  // ── Build chart data from campaigns (by date) ──────────────────────────────
  const buildChartData = (days: number): ChartPoint[] => {
    const now = new Date();
    const points: ChartPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = days === 7
        ? DAYS_AR[d.getDay()]
        : `${d.getDate()}/${d.getMonth() + 1}`;

      // Filter campaigns created on or before this day (approximation)
      const active = campaigns.filter(c => new Date(c.createdAt) <= d);
      const rev = active.reduce((s, c) => s + Number(c.revenue ?? 0), 0);
      const cl  = active.reduce((s, c) => s + Number(c.clicks ?? 0), 0);
      const conv = active.reduce((s, c) => s + Number(c.conversions ?? 0), 0);
      points.push({ day: dayStr, revenue: rev, clicks: cl, conversions: conv });
    }
    return points;
  };

  const chartData = buildChartData(range === "7d" ? 7 : 30);

  // ── Platform breakdown ─────────────────────────────────────────────────────
  const platformMap: Record<string, PlatformStat> = {};
  for (const c of campaigns) {
    const p = c.platform?.toLowerCase() ?? "other";
    if (!platformMap[p]) platformMap[p] = { name: c.platform, revenue: 0, clicks: 0, color: PLATFORM_COLORS[p] ?? "#7c3aed" };
    platformMap[p].revenue += Number(c.revenue ?? 0);
    platformMap[p].clicks  += Number(c.clicks ?? 0);
  }
  const platformData = Object.values(platformMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const totalPlatformRev = platformData.reduce((s, p) => s + p.revenue, 0);
  const pieData = platformData.map(p => ({
    name: p.name, value: totalPlatformRev > 0 ? Math.round(p.revenue / totalPlatformRev * 100) : 0, color: p.color,
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white">📊 Analytics</h1>
            <p className="text-purple-400 text-xs mt-0.5">
              {loading ? "جارٍ تحميل البيانات الحقيقية..." :
                lastUpdated ? `آخر تحديث: ${lastUpdated.toLocaleTimeString("ar-SA")} · ${campaigns.length} حملة` : "لا توجد بيانات"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50">
              ↻ تحديث
            </button>
            <div className="flex bg-[#130d2a] border border-purple-900/40 rounded-xl p-1">
              {(["7d", "30d"] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white" : "text-purple-500 hover:text-white"}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        {/* No campaigns notice */}
        {!loading && campaigns.length === 0 && (
          <div className="mb-5 p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl text-xs text-amber-300">
            ⚠️ لا توجد حملات بعد. أنشئ حملاتك من صفحة <strong>Campaigns</strong> لتظهر البيانات هنا.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-5">
          {KPIS.map(kpi => (
            <div key={kpi.label} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-3 hover:border-purple-700/60 transition-colors">
              <p className="text-xl mb-1">{kpi.icon}</p>
              <p className={`text-base font-black ${loading ? "text-purple-800 animate-pulse" : "text-white"}`}>
                {loading ? "..." : kpi.value}
              </p>
              <p className="text-[9px] text-purple-400 leading-tight mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {/* Revenue chart */}
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <h2 className="text-sm font-bold text-purple-300 mb-3">📈 الإيراد عبر الزمن</h2>
            {loading ? <div className="h-44 flex items-center justify-center text-purple-700 text-xs animate-pulse">جارٍ التحميل...</div> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1535" />
                  <XAxis dataKey="day" tick={{ fill: "#7c3aed", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#7c3aed", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8 }} labelStyle={{ color: "#c4b5fd" }} itemStyle={{ color: "#a78bfa" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "الإيراد"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#revG)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Clicks chart */}
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <h2 className="text-sm font-bold text-purple-300 mb-3">👆 النقرات</h2>
            {loading ? <div className="h-44 flex items-center justify-center text-purple-700 text-xs animate-pulse">جارٍ التحميل...</div> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1535" />
                  <XAxis dataKey="day" tick={{ fill: "#7c3aed", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#7c3aed", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8 }} labelStyle={{ color: "#c4b5fd" }} itemStyle={{ color: "#60a5fa" }} formatter={(v: number) => [v.toLocaleString(), "نقرة"]} />
                  <Bar dataKey="clicks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {/* Bar by platform */}
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <h2 className="text-sm font-bold text-purple-300 mb-3">🌐 الإيراد حسب المنصة</h2>
            {!loading && platformData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-purple-700 text-xs">لا توجد بيانات منصات</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={platformData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1535" />
                  <XAxis dataKey="name" tick={{ fill: "#7c3aed", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#7c3aed", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8 }} labelStyle={{ color: "#c4b5fd" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "إيراد"]} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {platformData.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie */}
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <h2 className="text-sm font-bold text-purple-300 mb-3">🥧 توزيع الإيراد</h2>
            {!loading && pieData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-purple-700 text-xs">لا توجد بيانات</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8 }} formatter={(v: number) => [`${v}%`, "الحصة"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {pieData.map(p => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-[10px] text-purple-300">{p.name}</span>
                      <span className="text-[10px] text-white ml-auto font-mono">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaigns table */}
        <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
          <h2 className="text-sm font-bold text-purple-300 mb-3">📋 الحملات الحقيقية ({campaigns.length})</h2>
          {loading ? (
            <div className="text-center py-8 text-purple-600 text-xs animate-pulse">جارٍ التحميل...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-purple-700 text-xs">لا توجد حملات — أنشئ حملة أولاً</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-purple-600 border-b border-purple-900/30">
                    <th className="text-right py-2 font-semibold">الحملة</th>
                    <th className="text-right py-2 font-semibold">المنصة</th>
                    <th className="text-right py-2 font-semibold">الشبكة</th>
                    <th className="text-right py-2 font-semibold">الإيراد</th>
                    <th className="text-right py-2 font-semibold">النقرات</th>
                    <th className="text-right py-2 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                      <td className="py-2 text-white font-medium">{c.name}</td>
                      <td className="py-2 text-purple-400">{c.platform}</td>
                      <td className="py-2 text-purple-400">{c.network}</td>
                      <td className="py-2 text-emerald-400 font-mono">${Number(c.revenue ?? 0).toFixed(2)}</td>
                      <td className="py-2 text-blue-400 font-mono">{Number(c.clicks ?? 0).toLocaleString()}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${c.status === "active" ? "text-emerald-400 border-emerald-800/40 bg-emerald-900/20" : "text-gray-500 border-gray-800/30 bg-gray-900/20"}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
