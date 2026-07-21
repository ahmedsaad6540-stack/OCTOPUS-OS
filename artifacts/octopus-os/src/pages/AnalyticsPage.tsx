import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const PERIODS = ["1d", "7d", "30d", "90d"] as const;
type Period = typeof PERIODS[number];
type Mode = "business" | "system";

interface DailyData { day: string; revenue: number; clicks: number; conversions: number; }

interface AnalyticsSummary {
  revenue: number;
  clicks: number;
  conversions: number;
  spent: number;
  roi: number;
  activeCampaigns: number;
  totalCampaigns: number;
  videos: { total: number; done: number; failed: number; rendering: number };
}

export function AnalyticsPage() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>("7d");
  const [mode, setMode] = useState<Mode>("business");
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily] = useState<DailyData[]>([]);

  // System-mode task/agent counters
  const [agentCount, setAgentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Real analytics from new endpoint
      const res = await fetch(`${API_BASE}/analytics/summary?period=${period}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary);
          setDaily(data.daily ?? []);
        }
      }

      // System panel — real counts
      const [tasksRes, agentsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/tasks`, { headers }),
        fetch(`${API_BASE}/agents`, { headers }),
      ]);

      if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
        const data = await tasksRes.value.json();
        const tasks: { status: string }[] = Array.isArray(data) ? data : data.tasks ?? [];
        setTaskCount(tasks.length);
        setActiveTasks(tasks.filter(t => t.status === "running" || t.status === "active").length);
        setCompletedTasks(tasks.filter(t => t.status === "completed").length);
      }

      if (agentsRes.status === "fulfilled" && agentsRes.value.ok) {
        const data = await agentsRes.value.json();
        const agents = Array.isArray(data) ? data : data.agents ?? [];
        setAgentCount(agents.length);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  // Re-fetch when period changes (period selector is now functional)
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Build bar chart arrays from daily data (last 7 points)
  const last7 = daily.slice(-7);
  const revenueChart = last7.map(d => d.revenue);
  const clicksChart = last7.map(d => d.clicks);
  const labels = last7.map(d => {
    const date = new Date(d.day);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  });

  // Pad to 7 if fewer days
  while (revenueChart.length < 7) { revenueChart.unshift(0); labels.unshift("—"); }
  while (clicksChart.length < 7) { clicksChart.unshift(0); }

  const maxRev = Math.max(...revenueChart, 1);
  const maxClicks = Math.max(...clicksChart, 1);

  const fmt$ = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(2)}`;

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            📊 {t("analyticsTitle")}
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">
            {loading ? "جاري تحميل البيانات..." : `بيانات حقيقية — الفترة: ${period} | من PostgreSQL`}
          </p>
        </div>

        {/* Period selection — NOW FUNCTIONAL */}
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-purple-950">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? "gradient-purple text-white shadow-md"
                  : "text-purple-400 hover:text-purple-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-black/40 border border-purple-950">
        {(["business", "system"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === m ? "gradient-purple text-white shadow-md" : "text-purple-400 hover:text-purple-300"
            }`}
          >
            {m === "business" ? t("businessPerformance") : t("systemObservability")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mode === "business" ? (
        <>
          {/* Real KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("totalRevenue"), value: fmt$(summary?.revenue ?? 0), delta: `ROI: ${summary?.roi ?? 0}%`, icon: "💰", up: (summary?.roi ?? 0) > 0 },
              { label: t("totalClicks"), value: (summary?.clicks ?? 0).toLocaleString(), delta: `${period} فترة`, icon: "👆", up: true },
              { label: t("conversions"), value: String(summary?.conversions ?? 0), delta: `من ${summary?.totalCampaigns ?? 0} حملة`, icon: "✅", up: true },
              { label: t("avgRoi"), value: `${summary?.roi ?? 0}%`, delta: `Spent: ${fmt$(summary?.spent ?? 0)}`, icon: "📈", up: (summary?.roi ?? 0) > 0 },
            ].map((k) => (
              <div key={k.label} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    k.up ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                         : "bg-red-950/40 text-red-400 border border-red-500/20"
                  }`}>
                    {k.delta}
                  </span>
                </div>
                <div className="text-xl font-black text-white font-heading">{k.value}</div>
                <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart — real daily data */}
            <div className="lg:col-span-2 glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 font-heading">
                {t("revenue7d")} — {period}
              </h3>
              <p className="text-[10px] text-purple-400/40 mb-4">
                {revenueChart.every(v => v === 0) ? "لا توجد إيرادات مسجلة في هذه الفترة بعد" : "بيانات حقيقية من PostgreSQL"}
              </p>
              <div className="flex items-end gap-2 h-36 mt-4">
                {revenueChart.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {val > 0 ? `$${val.toFixed(0)}` : "—"}
                    </span>
                    <div
                      className="w-full rounded-t-lg gradient-purple shadow-md glow-purple"
                      style={{ height: `${(val / maxRev) * 100}%`, minHeight: 4, opacity: val > 0 ? 1 : 0.15 }}
                    />
                    <span className="text-[9px] text-purple-400/60 font-mono">{labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign breakdown */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">
                {t("byPlacement")}
              </h3>
              <div className="space-y-3">
                {[
                  { label: "حملات نشطة", value: summary?.activeCampaigns ?? 0, color: "#10b981" },
                  { label: "إجمالي الحملات", value: summary?.totalCampaigns ?? 0, color: "#a855f7" },
                  { label: "فيديوهات مكتملة", value: summary?.videos.done ?? 0, color: "#3b82f6" },
                  { label: "فيديوهات فاشلة", value: summary?.videos.failed ?? 0, color: "#ef4444" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#7c6f9a" }}>{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clicks Chart */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">
              {t("clicks7d")} — {period}
            </h3>
            <div className="flex items-end gap-2 h-24 mt-4">
              {clicksChart.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-indigo-500/50 border border-indigo-500/30"
                    style={{ height: `${(val / maxClicks) * 100}%`, minHeight: 4, opacity: val > 0 ? 1 : 0.15 }}
                  />
                  <span className="text-[9px] text-purple-400/60 font-mono">{labels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* System Vitals — real counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("requestsToday"), value: `${taskCount} tasks`, delta: "from /api/tasks", icon: "🔮" },
              { label: "Videos Rendered", value: `${summary?.videos.done ?? 0} done`, delta: `${summary?.videos.rendering ?? 0} in progress`, icon: "🎬" },
              { label: t("cpuLoad"), value: `${agentCount} agents`, delta: "from /api/agents", icon: "🖥️" },
              { label: t("memoryFootprint"), value: `${activeTasks} active`, delta: `${completedTasks} done`, icon: "🧠" },
            ].map((k, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-950/40 text-purple-400 border border-purple-500/20 font-mono">
                    {k.delta}
                  </span>
                </div>
                <div className="text-lg font-black text-white font-heading">{k.value}</div>
                <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">
              Videos Pipeline Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "إجمالي الفيديوهات", value: summary?.videos.total ?? 0, color: "#a855f7" },
                { label: "مكتملة", value: summary?.videos.done ?? 0, color: "#10b981" },
                { label: "قيد الرندر", value: summary?.videos.rendering ?? 0, color: "#f59e0b" },
                { label: "فاشلة", value: summary?.videos.failed ?? 0, color: "#ef4444" },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-lg" style={{ background: "#1a0d38" }}>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs mt-1" style={{ color: "#7c6f9a" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
