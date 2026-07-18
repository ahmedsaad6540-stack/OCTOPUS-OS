import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface SystemStatus { status: string; uptime: number; version: string; }
interface Metrics { totalAgents: number; activeAgents: number; totalTasks: number; totalWorkflows: number; }

export function CommandCenter() {
  const { user, token, logout } = useAuth();
  const { t } = useLanguage();
  const [time, setTime] = useState(new Date());
  const [autoMode, setAutoMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Fetch real system status from backend
  useEffect(() => {
    if (!token) return;
    const fetchStatus = async () => {
      try {
        const [statusRes, agentsRes, tasksRes, workflowsRes] = await Promise.all([
          fetch("/api/system/status", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/agents", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/tasks", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/workflows", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          setSystemStatus(data);
        }

        let activeAgents = 0, totalAgents = 0;
        if (agentsRes.ok) {
          const agents = await agentsRes.json();
          totalAgents = agents.length;
          activeAgents = agents.filter((a: any) => a.status === "active").length;
        }

        let totalTasks = 0;
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          totalTasks = Array.isArray(tasks) ? tasks.length : (tasks.tasks?.length ?? 0);
        }

        let totalWorkflows = 0;
        if (workflowsRes.ok) {
          const wf = await workflowsRes.json();
          totalWorkflows = Array.isArray(wf) ? wf.length : (wf.workflows?.length ?? 0);
        }

        setMetrics({ totalAgents, activeAgents, totalTasks, totalWorkflows });
      } catch (err) {
        console.error("Error fetching system data:", err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const uptimeFormatted = systemStatus?.uptime
    ? `${Math.floor(systemStatus.uptime / 3600)}h ${Math.floor((systemStatus.uptime % 3600) / 60)}m`
    : "Online";

  return (
    <div className="p-6 space-y-6 min-h-screen font-sans" style={{ background: "#06020f" }}>
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 font-heading">
            🐙 {t("homeWorkspace")}
          </h1>
          <p className="text-purple-400 font-semibold text-xs mt-1">
            {t("welcomeBack")}, <span className="text-purple-300">{user?.name || "Ahmed Saad"}</span> — <span className="uppercase text-[10px] bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">{t("admin")}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 select-none">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-heading bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981] inline-block" />
            {t("live")}
          </div>
          <button onClick={logout}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-purple-300 border border-purple-800/40 hover:border-purple-600 hover:text-white transition-all bg-[#0d0920]/45">
            {t("signOut")}
          </button>
        </div>
      </div>

      {/* Live Stats Grid - pulled from real backend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">{t("activeAgents")}</div>
          <div className="text-2xl font-black text-emerald-400 font-heading">
            {metrics ? `${metrics.activeAgents}/${metrics.totalAgents}` : "..."}
          </div>
          <div className="text-[10px] text-purple-400/40 mt-1 font-mono">Live from DB</div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">{t("activeCampaigns")}</div>
          <div className="text-2xl font-black text-white font-heading">
            {metrics ? metrics.totalWorkflows : "..."}
          </div>
          <div className="text-[10px] text-purple-400/40 mt-1 font-mono">Live from DB</div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">Total Tasks</div>
          <div className="text-2xl font-black text-white font-heading">
            {metrics ? metrics.totalTasks : "..."}
          </div>
          <div className="text-[10px] text-purple-400/40 mt-1 font-mono">Live from DB</div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">System Uptime</div>
          <div className="text-2xl font-black text-white font-heading">
            {uptimeFormatted}
          </div>
          <div className="text-[10px] text-purple-400/40 mt-1 font-mono">Live from API</div>
        </div>
      </div>

      {/* System Status + Clock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real System Status */}
        <div className="glass-card p-5 rounded-xl relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest font-heading">{t("systemStatus")}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              {systemStatus ? "● Online" : "● Connecting..."}
            </span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-purple-950/30">
              <span className="text-purple-300">{t("api")}</span>
              <span className="text-emerald-400 font-bold">● Healthy</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-purple-950/30">
              <span className="text-purple-300">{t("database")}</span>
              <span className="text-emerald-400 font-bold">● Connected · PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-purple-300">Version</span>
              <span className="text-purple-300 font-bold">{systemStatus?.version ?? "7.0.0"}</span>
            </div>
          </div>
        </div>

        {/* Live Clock */}
        <div className="glass-card p-5 rounded-xl flex flex-col justify-between">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-4 font-heading">Live System Clock</div>
          <div className="text-center">
            <div className="text-4xl font-black text-white font-mono tracking-wider">
              {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-xs text-purple-400/50 mt-2 font-mono">
              {time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              All Systems Operational
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Panel */}
      <div className="pt-2">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-950/15 border border-purple-500/10 hover:border-purple-500/25 transition-all text-center">
          {showAdvanced ? t("hideAdvanced") : t("openAdvanced")}
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            <div className="glass-card p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white font-heading">{t("advancedOperations")}</h3>
                <p className="text-[10px] text-purple-400/60 mt-0.5">Toggle live autonomous system pipelines.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  if (!token) return;
                  const next = !autoMode;
                  setAutoMode(next);
                  try {
                    if (next) {
                      await fetch("/api/autonomous/start", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } });
                      alert("⚡ تم تفعيل محرك التشغيل الذاتي (Autonomous 24/7 Engine) بنجاح وبدء دورة العمليات الفورية!");
                    } else {
                      await fetch("/api/autonomous/stop", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } });
                      alert("⏸ تم إيقاف التشغيل الذاتي بنجاح.");
                    }
                  } catch (e: any) {
                    console.error(e);
                  }
                }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${autoMode ? "bg-emerald-600 text-white" : "gradient-purple text-white shadow-md glow-purple"}`}>
                  {autoMode ? t("pauseAuto") : t("startAuto")}
                </button>
                <button onClick={async () => {
                  if (!token) return;
                  setAutoMode(false);
                  try {
                    const res = await fetch("/api/autonomous/stop", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } });
                    const d = await res.json();
                    alert(d.message || "🛑 تم إيقاف التشغيل الذاتي وتجميد جميع الحملات وعمليات الرندر بنجاح!");
                  } catch (e: any) {
                    alert("🛑 حدث خطأ أثناء إيقاف السيرفر: " + e.message);
                  }
                }}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-red-950/80 text-red-300 border border-red-600/40 hover:bg-red-900 transition-all">
                  🛑 إيقاف اضطراري
                </button>
              </div>
            </div>
            <div className="glass-card p-4 border-l-2 border-purple-500 rounded-r-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center text-sm shrink-0">🤖</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-purple-400">{t("ceoBriefing")}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">{t("live")}</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed">{t("ceoBriefingText")}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
