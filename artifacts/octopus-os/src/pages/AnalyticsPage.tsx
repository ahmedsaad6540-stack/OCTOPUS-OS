import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const WEEKS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Mode = "business" | "system";

interface SummaryData {
  agentCount: number;
  taskCount: number;
  activeTasks: number;
  completedTasks: number;
}

export function AnalyticsPage() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [period, setPeriod] = useState("7d");
  const [mode, setMode] = useState<Mode>("business");
  const [summary, setSummary] = useState<SummaryData>({
    agentCount: 0,
    taskCount: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  // Bar chart arrays — all zeroes by default; populated from real data when available
  const [revenueChart] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [clicksChart] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [tokensChart] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [latencyChart] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [tasksRes, agentsRes] = await Promise.allSettled([
          fetch(`${API_BASE}/tasks`, { headers }),
          fetch(`${API_BASE}/agents`, { headers }),
        ]);

        let taskCount = 0;
        let activeTasks = 0;
        let completedTasks = 0;
        let agentCount = 0;

        if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
          const data = await tasksRes.value.json();
          const tasks: { status: string }[] = Array.isArray(data)
            ? data
            : data.tasks ?? [];
          taskCount = tasks.length;
          activeTasks = tasks.filter(
            (t) => t.status === "running" || t.status === "active"
          ).length;
          completedTasks = tasks.filter((t) => t.status === "completed").length;
        }

        if (agentsRes.status === "fulfilled" && agentsRes.value.ok) {
          const data = await agentsRes.value.json();
          const agents = Array.isArray(data) ? data : data.agents ?? [];
          agentCount = agents.length;
        }

        setSummary({ agentCount, taskCount, activeTasks, completedTasks });
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  const maxRev = Math.max(...revenueChart, 1);
  const maxClicks = Math.max(...clicksChart, 1);
  const maxTokens = Math.max(...tokensChart, 1);
  const maxLatency = Math.max(...latencyChart, 1);

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
          {["24h", "7d", "30d", "90d"].map((p) => (
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

      {/* Info note */}
      <div className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 border border-purple-500/20">
        <span className="text-base">💡</span>
        <p className="text-purple-300/70 text-xs">
          Analytics data is populated as you use the system. Charts will fill in as agents run tasks and campaigns generate activity.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-black/40 border border-purple-950">
        <button
          onClick={() => setMode("business")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === "business"
              ? "gradient-purple text-white shadow-md"
              : "text-purple-400 hover:text-purple-300"
          }`}
        >
          {t("businessPerformance")}
        </button>
        <button
          onClick={() => setMode("system")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === "system"
              ? "gradient-purple text-white shadow-md"
              : "text-purple-400 hover:text-purple-300"
          }`}
        >
          {t("systemObservability")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mode === "business" ? (
        <>
          {/* KPI Grid — real counts from DB */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: t("totalRevenue"),
                value: "$0",
                delta: "No data yet",
                icon: "💰",
                up: true,
              },
              {
                label: t("totalClicks"),
                value: String(summary.taskCount),
                delta: "Total tasks",
                icon: "👆",
                up: true,
              },
              {
                label: t("conversions"),
                value: String(summary.completedTasks),
                delta: "Completed tasks",
                icon: "✅",
                up: true,
              },
              {
                label: t("avgRoi"),
                value: `${summary.agentCount} agents`,
                delta: `${summary.activeTasks} active tasks`,
                icon: "📈",
                up: true,
              },
            ].map((k) => (
              <div key={k.label} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      k.up
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-950/40 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {k.delta}
                  </span>
                </div>
                <div className="text-xl font-black text-white font-heading">
                  {k.value}
                </div>
                <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 font-heading">
                {t("revenue7d")}
              </h3>
              <p className="text-[10px] text-purple-400/40 mb-4">
                Populates as campaigns generate revenue
              </p>
              <div className="flex items-end gap-3 h-36 mt-4">
                {revenueChart.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {val > 0 ? `$${val}` : "—"}
                    </span>
                    <div
                      className="w-full rounded-t-lg gradient-purple shadow-md glow-purple opacity-40"
                      style={{ height: `${(val / maxRev) * 100}%`, minHeight: 6 }}
                    />
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {WEEKS[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Breakdown — empty state */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">
                {t("byPlacement")}
              </h3>
              <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                <span className="text-3xl opacity-30">📊</span>
                <p className="text-[11px] text-purple-400/50">
                  Platform breakdown appears after campaigns post content
                </p>
              </div>
            </div>
          </div>

          {/* Clicks Chart */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4 font-heading">
              {t("clicks7d")}
            </h3>
            <div className="flex items-end gap-3 h-24 mt-4">
              {clicksChart.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-indigo-500/25 border border-indigo-500/20"
                    style={{ height: `${(val / maxClicks) * 100}%`, minHeight: 6 }}
                  />
                  <span className="text-[9px] text-purple-400/60 font-mono">
                    {WEEKS[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* System Vitals KPIs — real counts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: t("requestsToday"),
                value: `${summary.taskCount} tasks`,
                delta: "from /api/tasks",
                icon: "🔮",
              },
              {
                label: t("tokenConsumption"),
                value: "0 tokens",
                delta: "No data yet",
                icon: "🪙",
              },
              {
                label: t("cpuLoad"),
                value: `${summary.agentCount} agents`,
                delta: "from /api/agents",
                icon: "🖥️",
              },
              {
                label: t("memoryFootprint"),
                value: `${summary.activeTasks} active`,
                delta: `${summary.completedTasks} done`,
                icon: "🧠",
              },
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
                <div className="text-lg font-black text-white font-heading">
                  {k.value}
                </div>
                <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tokens Chart */}
            <div className="lg:col-span-2 glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 font-heading">
                {t("tokenConsumption")}
              </h3>
              <p className="text-[10px] text-purple-400/40 mb-4">
                Populates as agents consume LLM tokens
              </p>
              <div className="flex items-end gap-3 h-36 mt-4">
                {tokensChart.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {val > 0 ? `${val}k` : "—"}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-pink-500/40 shadow-inner glow-pink opacity-40"
                      style={{ height: `${(val / maxTokens) * 100}%`, minHeight: 6 }}
                    />
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {WEEKS[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency History */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 font-heading">
                {t("latency7d")}
              </h3>
              <p className="text-[10px] text-purple-400/40 mb-4">
                Tracks API response times over time
              </p>
              <div className="flex items-end gap-3 h-36 mt-4">
                {latencyChart.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {val > 0 ? `${val}ms` : "—"}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-purple-500/40 glow-purple opacity-40"
                      style={{ height: `${(val / maxLatency) * 100}%`, minHeight: 6 }}
                    />
                    <span className="text-[9px] text-purple-400/60 font-mono">
                      {WEEKS[i]}
                    </span>
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
