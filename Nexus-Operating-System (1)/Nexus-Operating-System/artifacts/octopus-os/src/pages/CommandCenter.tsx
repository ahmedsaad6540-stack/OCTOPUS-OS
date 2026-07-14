import { useState, useEffect } from "react";

const kpis = [
  { label: "Revenue Today", value: "$0", delta: "+0%", icon: "💰", color: "emerald" },
  { label: "Active Campaigns", value: "0", delta: "0 live", icon: "📣", color: "purple" },
  { label: "AI Requests", value: "0", delta: "0 today", icon: "🔮", color: "indigo" },
  { label: "Social Posts", value: "0", delta: "0 scheduled", icon: "📱", color: "blue" },
];

const agents = [
  { name: "Brain Agent", task: "Analyzing trends", status: "active", cpu: 42 },
  { name: "TrendHunter", task: "Scanning TikTok", status: "active", cpu: 67 },
  { name: "Creator Agent", task: "Generating scripts", status: "active", cpu: 38 },
  { name: "Publisher", task: "Waiting for content", status: "idle", cpu: 5 },
  { name: "Tracker", task: "Monitoring campaigns", status: "active", cpu: 28 },
  { name: "Money Agent", task: "Calculating ROI", status: "active", cpu: 19 },
  { name: "CEO Agent", task: "Reviewing daily summary", status: "active", cpu: 55 },
  { name: "Optimizer", task: "Idle", status: "idle", cpu: 2 },
  { name: "Voice Agent", task: "Idle", status: "idle", cpu: 1 },
  { name: "Competitor", task: "Scanning rivals", status: "active", cpu: 31 },
];

const chain = [
  { name: "GPT-4o", icon: "⚡", status: "active" },
  { name: "Gemini Pro", icon: "💎", status: "standby" },
  { name: "Claude 3.5", icon: "🔶", status: "standby" },
  { name: "DeepSeek", icon: "🌊", status: "standby" },
];

const missions = [
  { title: "Publish 18 TikTok videos", priority: "HIGH", status: "pending" },
  { title: "Optimize Amazon affiliate links", priority: "HIGH", status: "in-progress" },
  { title: "Analyze competitor campaigns", priority: "MED", status: "done" },
  { title: "Generate weekly report", priority: "LOW", status: "pending" },
];

export function CommandCenter() {
  const [time, setTime] = useState(new Date());
  const [autoMode, setAutoMode] = useState(false);
  const [revenue, setRevenue] = useState(2847);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!autoMode) return;
    const t = setInterval(() => setRevenue(r => r + Math.floor(Math.random() * 12 + 1)), 3000);
    return () => clearInterval(t);
  }, [autoMode]);

  const updatedKpis = [
    { ...kpis[0], value: `$${revenue.toLocaleString()}`, delta: "+12.4%" },
    { ...kpis[1], value: "7", delta: "3 live" },
    { ...kpis[2], value: "1,284", delta: "+89 today" },
    { ...kpis[3], value: "34", delta: "12 scheduled" },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#0a0614" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            🖥️ Command Center
            <span className="text-xs px-2 py-0.5 rounded-full font-normal"
              style={{ background: autoMode ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.15)",
                       color: autoMode ? "#10b981" : "#a78bfa" }}>
              {autoMode ? "⚡ AUTONOMOUS" : "STANDBY"}
            </span>
          </h1>
          <p className="text-purple-400/60 text-xs mt-0.5">
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — {time.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAutoMode(!autoMode)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${autoMode ? "bg-emerald-600 text-white" : "gradient-purple text-white glow-purple"}`}>
            {autoMode ? "⏸ Pause Autonomous" : "⚡ Start Autonomous Mode"}
          </button>
          {autoMode && (
            <button onClick={() => setAutoMode(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-900/70">
              🛑 Emergency Stop
            </button>
          )}
        </div>
      </div>

      {/* AI CEO Briefing */}
      <div className="card-os p-4 border-l-2 border-purple-500">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center text-lg shrink-0">🤖</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-purple-400">AI CEO — Daily Briefing</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span> Live
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              Good morning! Today I recommend publishing <strong className="text-purple-300">18 short videos</strong> — TikTok engagement is 41% above average. 
              Amazon affiliate product <strong className="text-emerald-300">X523</strong> saw a 41% revenue spike. 
              I advise <span className="text-yellow-300">avoiding TikTok posts before 7 AM</span>. 
              Consider migrating Campaign #4 to Pinterest for better ROI.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {updatedKpis.map((k) => (
          <div key={k.label} className="card-os p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{k.icon}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>{k.delta}</span>
            </div>
            <div className="text-xl font-bold text-white">{k.value}</div>
            <div className="text-xs text-purple-400/60 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agents */}
        <div className="col-span-2 card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-3">🤖 Agent Status</h3>
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.name} className="flex items-center gap-3 py-1.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.status === "active" ? "bg-emerald-400" : "bg-gray-600"}`}
                  style={a.status === "active" ? { boxShadow: "0 0 6px #10b981" } : {}}></div>
                <div className="w-28 shrink-0">
                  <div className="text-xs font-medium text-white">{a.name}</div>
                </div>
                <div className="flex-1 text-xs text-purple-400/60 truncate">{a.task}</div>
                <div className="w-20 shrink-0">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${a.cpu}%`, background: a.cpu > 50 ? "#f59e0b" : "#7c3aed" }}></div>
                    </div>
                    <span className="text-[10px] text-purple-400/60 w-7 text-right">{a.cpu}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* AI Failover Chain */}
          <div className="card-os p-4">
            <h3 className="text-xs font-bold text-purple-300 mb-3">🔮 AI Failover Chain</h3>
            {chain.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 mb-2">
                <span className="text-sm">{c.icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-white">{c.name}</div>
                  <div className="text-[10px] text-purple-400/60">Priority {i + 1}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-900/50 text-emerald-400" : "bg-purple-900/30 text-purple-400/60"}`}>
                  {c.status === "active" ? "ACTIVE" : "STANDBY"}
                </span>
              </div>
            ))}
          </div>

          {/* Today's Mission */}
          <div className="card-os p-4">
            <h3 className="text-xs font-bold text-purple-300 mb-3">🎯 Today's Mission</h3>
            <div className="space-y-2">
              {missions.map((m) => (
                <div key={m.title} className="flex items-start gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    m.priority === "HIGH" ? "bg-red-900/50 text-red-400" :
                    m.priority === "MED" ? "bg-yellow-900/50 text-yellow-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{m.priority}</span>
                  <div className="flex-1">
                    <div className={`text-xs ${m.status === "done" ? "line-through text-purple-400/40" : "text-white"}`}>{m.title}</div>
                  </div>
                  <span className={`text-[10px] ${m.status === "done" ? "text-emerald-400" : m.status === "in-progress" ? "text-yellow-400" : "text-purple-400/40"}`}>
                    {m.status === "done" ? "✓" : m.status === "in-progress" ? "⟳" : "○"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
