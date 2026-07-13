import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Task { id: string; name: string; agent: string; progress: number; status: "running" | "completed" | "failed"; time: string; }
interface Job { id: string; name: string; schedule: string; nextRun: string; status: "active" | "paused"; }

export function MissionControlPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Load from backend APIs
  const loadData = async () => {
    if (!token) return;
    try {
      // 1. Fetch system status & event logs
      const eventsRes = await fetch("/api/system/events", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        setLogs(events.map((e: any) => `[${new Date(e.createdAt).toLocaleTimeString()}] INFO [${e.source}] ${e.type}: ${JSON.stringify(e.payload)}`));
      }

      // 2. Fetch tasks
      const tasksRes = await fetch("/api/tasks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const dbTasks = await tasksRes.json();
        setTasks(dbTasks.map((t: any) => ({
          id: t.id,
          name: t.type,
          agent: t.queue,
          progress: t.status === "completed" ? 100 : t.status === "failed" ? 0 : 50,
          status: t.status === "completed" ? "completed" : t.status === "failed" ? "failed" : "running",
          time: new Date(t.createdAt).toLocaleTimeString()
        })));
      }

      // 3. Fetch workflows
      const workflowsRes = await fetch("/api/workflows", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (workflowsRes.ok) {
        const dbWorkflows = await workflowsRes.json();
        setWorkflows(dbWorkflows);
      }

      // 4. Fetch scheduled jobs
      const jobsRes = await fetch("/api/scheduled-jobs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (jobsRes.ok) {
        const dbJobs = await jobsRes.json();
        setJobs(dbJobs.map((j: any) => ({
          id: j.id,
          name: j.name,
          schedule: j.cronExpression,
          nextRun: j.nextRunAt ? new Date(j.nextRunAt).toLocaleTimeString() : "--",
          status: j.status === "active" ? "active" : "paused"
        })));
      }
    } catch (err) {
      console.error("Error loading mission control data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, [token]);

  // Scroll to bottom of console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const toggleJob = async (id: string, currentStatus: "active" | "paused") => {
    if (!token) return;
    const isEnabling = currentStatus !== "active";
    const endpoint = `/api/scheduled-jobs/${id}/${isEnabling ? "enable" : "disable"}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencyStop = async () => {
    if (!token) return;
    // Cancel all running tasks in database
    for (const t of tasks) {
      if (t.status === "running") {
        await fetch(`/api/tasks/${t.id}/cancel`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    }
    loadData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            🚀 {t("missionControlRoom")}
            <span className="text-xs px-2 py-0.5 rounded-full font-normal bg-purple-950/40 border border-purple-500/20 text-purple-400">
              {t("pipelinesActive")}
            </span>
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">{t("missionControlDesc")}</p>
        </div>
        <button onClick={handleEmergencyStop}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 hover:bg-red-900/40 text-red-400 border border-red-500/20 shadow-md transition-all font-sans">
          {t("abortAll")}
        </button>
      </div>

      {/* Overview Stat Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t("activePipelines"), value: tasks.filter(t => t.status === "running").length, icon: "⚡", color: "text-purple-400" },
          { label: t("queuedTasks"), value: tasks.filter(t => t.status === "running").length, icon: "📋", color: "text-blue-400" },
          { label: t("activeCronJobs"), value: jobs.filter(j => j.status === "active").length, icon: "⏰", color: "text-emerald-400" },
          { label: t("taskSuccessRate"), value: "100.0%", icon: "🎯", color: "text-pink-400" },
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-4 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-purple-400/50 font-medium">{item.label}</span>
              <span className="text-lg">{item.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Tasks & Workflows */}
        <div className="lg:col-span-2 space-y-6">
          {/* Running Tasks Card */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
              <span>⚡</span> {t("activeExecution")}
            </h3>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-purple-400/40 text-xs font-mono">
                  No active tasks running. Run a campaign or trigger automation.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex flex-col p-3 rounded-lg bg-purple-950/10 border border-purple-500/5 hover:border-purple-500/10 transition-all animate-fadeIn">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{task.name}</div>
                        <div className="text-[10px] text-purple-400/50 mt-0.5 font-mono">ID: {task.id} · {t("executor")}: <span className="text-purple-400">{task.agent}</span> · {task.time}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        task.status === "running" ? "bg-purple-900/30 text-purple-400 animate-pulse" :
                        task.status === "completed" ? "bg-emerald-950/50 text-emerald-400" :
                        "bg-red-950/40 text-red-400"
                      }`}>
                        {t(task.status)}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-purple-950/40 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${task.progress}%`,
                            background: task.status === "failed" ? "#ef4444" : task.status === "completed" ? "#10b981" : "linear-gradient(90deg, #7c3aed, #ec4899)"
                          }} />
                      </div>
                      <span className="text-[10px] font-mono text-purple-400 w-8 text-right">{task.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workflows List */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
              <span>🔄</span> {t("workflowAutomations")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {workflows.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-purple-400/40 text-xs font-mono">
                  No custom workflow automations defined.
                </div>
              ) : (
                workflows.map((w, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-purple-950/10 border border-purple-500/5 flex justify-between items-center animate-fadeIn">
                    <div>
                      <div className="text-xs font-bold text-white">{w.name}</div>
                      <div className="text-[10px] text-purple-400/50 mt-0.5 font-mono">Status: {w.status}</div>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${w.status === "active" ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-gray-600"}`} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Scheduled Jobs & Live Console */}
        <div className="space-y-6">
          {/* Scheduled Jobs */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <span>⏰</span> {t("scheduledJobs")}
            </h3>
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-6 text-purple-400/40 text-xs font-mono">
                  No active scheduled cron jobs.
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="flex justify-between items-center p-2.5 rounded-lg bg-purple-950/10 border border-purple-500/5 animate-fadeIn">
                    <div>
                      <div className="text-xs font-bold text-white">{job.name}</div>
                      <div className="text-[10px] text-purple-400/60 font-mono mt-0.5">{job.schedule}</div>
                      <div className="text-[9px] text-purple-500/40 mt-0.5 font-mono">Next Run: {job.nextRun}</div>
                    </div>
                    <button onClick={() => toggleJob(job.id, job.status)}
                      className={`w-8 h-4 rounded-full relative transition-all ${job.status === "active" ? "bg-purple-600" : "bg-gray-700"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${job.status === "active" ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live System Console */}
          <div className="glass-card p-5 rounded-xl flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <span>💻</span> {t("liveTerminal")}
            </h3>
            <div className="flex-1 bg-black/80 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-emerald-400 overflow-y-auto border border-purple-950">
              {logs.length === 0 ? (
                <div className="text-purple-400/30 text-center py-20 italic">Listening for system-events...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="mb-1 whitespace-pre-wrap">
                    {log.includes("SUCCESS") ? <span className="text-emerald-300">{log}</span> :
                     log.includes("WARNING") ? <span className="text-yellow-400">{log}</span> :
                     log.includes("error") || log.includes("fail") ? <span className="text-red-400 font-bold">{log}</span> :
                     <span className="text-purple-300/80">{log}</span>}
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
