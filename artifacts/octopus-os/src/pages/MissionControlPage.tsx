import { useState, useEffect, useRef } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Task { id: string; name: string; agent: string; progress: number; status: "running" | "completed" | "failed"; time: string; }
interface Job { id: string; name: string; schedule: string; nextRun: string; status: "active" | "paused"; }

const PIPELINE_STAGES = [
  { label: "AI Script Generation", icon: "✍️", color: "#a855f7" },
  { label: "Video Rendering (HeyGen)", icon: "🎬", color: "#3b82f6" },
  { label: "Voice Synthesis (ElevenLabs)", icon: "🎙️", color: "#06b6d4" },
  { label: "Social Publishing", icon: "📤", color: "#10b981" },
  { label: "Analytics Collection", icon: "📊", color: "#f59e0b" },
  { label: "Profit Engine Optimization", icon: "💰", color: "#ec4899" },
];

interface DashboardStats {
  campaigns: {
    total: number; active: number; revenue: number; revenueToday: number;
    profit: number; profitToday: number; clicks: number; conversions: number;
  };
  videos: { total: number; done: number; rendering: number; failed: number; today: number };
  social: { connected: number; total: number };
  agents: { total: number; active: number };
  recentEvents: Array<{ type: string; source: string; payload: unknown; createdAt: string }>;
}

export function MissionControlPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePipelineIdx, setActivePipelineIdx] = useState(1);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // Real KPI stats from aggregation endpoint
      const statsRes = await fetch(`${API_BASE}/dashboard/stats`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) setStats(data.stats);

        // Build live log from real system events
        const events: Array<{ type: string; source: string; payload: unknown; createdAt: string }> = data.stats?.recentEvents ?? [];
        if (events.length > 0) {
          const formatted = events.slice(0, 50).map((e) =>
            `[${new Date(e.createdAt).toLocaleTimeString("en-US", { hour12: false })}] INFO  [${e.source}] ${e.type}`
          );
          setLogs(formatted);
        }
      }

      // Real task queue
      const tasksRes = await fetch(`${API_BASE}/tasks`, { headers });
      if (tasksRes.ok) {
        const dbTasks = await tasksRes.json();
        if (Array.isArray(dbTasks)) {
          setTasks(dbTasks.slice(0, 20).map((t: any) => ({
            id: t.id,
            name: t.type,
            agent: t.queue,
            progress: t.status === "completed" ? 100 : t.status === "failed" ? 0 : 50,
            status: t.status === "completed" ? "completed" : t.status === "failed" ? "failed" : "running",
            time: new Date(t.createdAt).toLocaleTimeString(),
          })));
        }
      }

      // Real scheduled jobs
      const jobsRes = await fetch(`${API_BASE}/scheduled-jobs`, { headers });
      if (jobsRes.ok) {
        const dbJobs = await jobsRes.json();
        if (Array.isArray(dbJobs) && dbJobs.length > 0) {
          setJobs(dbJobs.map((j: any) => ({
            id: j.id,
            name: j.name,
            schedule: j.cronExpression,
            nextRun: j.nextRunAt ? new Date(j.nextRunAt).toLocaleTimeString() : "--",
            status: j.status === "active" ? "active" : "paused",
          })));
        }
      }
    } catch (err) {
      console.error("MissionControl loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 10 seconds for live updates
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Animate pipeline stage every 4s
  useEffect(() => {
    const iv = setInterval(() => setActivePipelineIdx(p => (p + 1) % PIPELINE_STAGES.length), 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { consoleEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const handleEmergencyStop = async () => {
    if (!token) return;
    if (!confirm("🛑 هذا سيوقف:\n• AI Agents الجارية\n• قائمة الانتظار (Pending Queue)\n• Cron Jobs المجدولة\n• النشر النشط على السوشيال\n• رندر الفيديو\n\nهل تريد الاستمرار؟")) return;
    try {
      await fetch(`${API_BASE}/autonomous/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      });
      alert("🛑 تم إيقاف جميع العمليات بنجاح!");
    } catch (e: any) { alert("خطأ: " + e.message); }
    loadData();
  };

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const settledCount = tasks.filter(t => t.status === "completed" || t.status === "failed").length;
  const successRate = settledCount === 0 ? "—" : `${((completedCount / settledCount) * 100).toFixed(1)}%`;

  const kpi = {
    revenueToday: stats?.campaigns.revenueToday ?? 0,
    profitToday: stats?.campaigns.profitToday ?? 0,
    videosToday: stats?.videos.today ?? 0,
    postsPublished: stats?.videos.done ?? 0,
    views: stats?.campaigns.clicks ? `${(stats.campaigns.clicks / 1000).toFixed(1)}K` : "0",
    clicks: stats?.campaigns.clicks ?? 0,
    conversions: stats?.campaigns.conversions ?? 0,
  };

  const activeAgents = stats?.agents.active ?? 0;
  const connectedSocial = stats?.social.connected ?? 0;

  return (
    <div className="p-6 min-h-screen space-y-6" style={{ background: "#0a0614", color: "#e2d9f3" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#c084fc" }}>
            🎛 Mission Control
          </h1>
          <p className="text-sm" style={{ color: "#7c6f9a" }}>
            {loading ? "جاري تحميل البيانات من قاعدة البيانات..." : "بيانات حية من PostgreSQL — يتحدث كل 10 ثوانٍ"}
          </p>
        </div>
        <button
          onClick={handleEmergencyStop}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{ background: "#7f1d1d", border: "1px solid #ef4444", color: "#fca5a5" }}
        >
          🛑 إيقاف اضطراري
        </button>
      </div>

      {/* KPI Grid — real data from /dashboard/stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إيرادات اليوم", value: `$${kpi.revenueToday.toFixed(2)}`, icon: "💵", color: "#10b981" },
          { label: "ربح اليوم", value: `$${kpi.profitToday.toFixed(2)}`, icon: "💰", color: "#a855f7" },
          { label: "فيديوهات اليوم", value: String(kpi.videosToday), icon: "🎬", color: "#3b82f6" },
          { label: "منشورات مكتملة", value: String(kpi.postsPublished), icon: "📤", color: "#06b6d4" },
          { label: "النقرات الكلية", value: kpi.clicks.toLocaleString(), icon: "👆", color: "#f59e0b" },
          { label: "التحويلات", value: String(kpi.conversions), icon: "🎯", color: "#ec4899" },
          { label: "معدل النجاح", value: successRate, icon: "✅", color: "#84cc16" },
          { label: "حسابات متصلة", value: String(connectedSocial), icon: "🔗", color: "#8b5cf6" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-xs mt-1" style={{ color: "#7c6f9a" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline + Agents Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Pipeline */}
        <div className="rounded-xl p-4 border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#c084fc" }}>⚡ خط إنتاج الحملة</h2>
          <div className="space-y-2">
            {PIPELINE_STAGES.map((stage, idx) => (
              <div
                key={stage.label}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: idx === activePipelineIdx ? `${stage.color}20` : "transparent",
                  border: `1px solid ${idx === activePipelineIdx ? stage.color : "#2d1b5e"}`,
                }}
              >
                <span>{stage.icon}</span>
                <span className="text-xs flex-1" style={{ color: idx === activePipelineIdx ? stage.color : "#7c6f9a" }}>
                  {stage.label}
                </span>
                {idx === activePipelineIdx && (
                  <span className="text-xs animate-pulse" style={{ color: stage.color }}>● جاري</span>
                )}
                {idx < activePipelineIdx && (
                  <span className="text-xs" style={{ color: "#10b981" }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Real Agent Stats */}
        <div className="rounded-xl p-4 border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#c084fc" }}>
            🤖 AI Agents — {activeAgents} نشط من {stats?.agents.total ?? 0}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-xs p-2 rounded" style={{ background: "#1a0d38" }}>
              <span style={{ color: "#a78bfa" }}>حملات نشطة</span>
              <span style={{ color: "#10b981" }}>{stats?.campaigns.active ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded" style={{ background: "#1a0d38" }}>
              <span style={{ color: "#a78bfa" }}>فيديوهات قيد الرندر</span>
              <span style={{ color: "#f59e0b" }}>{stats?.videos.rendering ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded" style={{ background: "#1a0d38" }}>
              <span style={{ color: "#a78bfa" }}>فيديوهات مكتملة</span>
              <span style={{ color: "#10b981" }}>{stats?.videos.done ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded" style={{ background: "#1a0d38" }}>
              <span style={{ color: "#a78bfa" }}>حسابات سوشيال متصلة</span>
              <span style={{ color: "#3b82f6" }}>{stats?.social.connected ?? 0} / {stats?.social.total ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded" style={{ background: "#1a0d38" }}>
              <span style={{ color: "#a78bfa" }}>إجمالي الإيرادات</span>
              <span style={{ color: "#a855f7" }}>${(stats?.campaigns.revenue ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tasks (real from task queue) */}
      <div className="rounded-xl p-4 border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#c084fc" }}>
          📋 قائمة المهام الحالية ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "#7c6f9a" }}>لا توجد مهام نشطة حالياً</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "#1a0d38" }}>
                <div className="w-2 h-2 rounded-full" style={{
                  background: task.status === "completed" ? "#10b981" : task.status === "failed" ? "#ef4444" : "#f59e0b"
                }} />
                <span className="text-xs flex-1" style={{ color: "#c4b5fd" }}>{task.name}</span>
                <span className="text-xs" style={{ color: "#7c6f9a" }}>{task.agent}</span>
                <span className="text-xs" style={{ color: "#7c6f9a" }}>{task.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Jobs (real) */}
      {jobs.length > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#c084fc" }}>⏱ Cron Jobs المجدولة</h2>
          <div className="space-y-2">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "#1a0d38" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: job.status === "active" ? "#10b981" : "#6b7280" }} />
                  <span className="text-xs" style={{ color: "#c4b5fd" }}>{job.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "#7c6f9a" }}>
                  <span>{job.schedule}</span>
                  <span>التالي: {job.nextRun}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Event Log (real from system_events table) */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#050210", borderColor: "#2d1b5e" }}>
        <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: "#2d1b5e", background: "#0a0519" }}>
          <span className="text-xs font-mono" style={{ color: "#10b981" }}>● LIVE — System Events Log</span>
          <span className="text-xs" style={{ color: "#7c6f9a" }}>{logs.length} سجل</span>
        </div>
        <div className="p-4 font-mono text-xs h-48 overflow-y-auto space-y-1" style={{ color: "#a78bfa" }}>
          {logs.length === 0 ? (
            <span style={{ color: "#7c6f9a" }}>لا توجد أحداث حديثة في قاعدة البيانات...</span>
          ) : (
            logs.map((line, i) => <div key={i}>{line}</div>)
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
}
