import { useState } from "react";

const AGENTS = [
  { id: 1, name: "Brain Agent", icon: "🧠", status: "active", task: "Analyzing trending niches", cpu: 42, requests: 892, desc: "Central intelligence — synthesizes all data, drives strategic decisions." },
  { id: 2, name: "TrendHunter", icon: "📈", status: "active", task: "Scanning TikTok trends", cpu: 67, requests: 234, desc: "Detects viral trends 48h early across TikTok, YouTube, and Instagram." },
  { id: 3, name: "Creator Agent", icon: "✍️", status: "active", task: "Writing 18 video scripts", cpu: 38, requests: 156, desc: "Generates unique, platform-optimized video scripts and content." },
  { id: 4, name: "Publisher Agent", icon: "📢", status: "idle", task: "Waiting for Creator output", cpu: 5, requests: 0, desc: "Schedules and publishes content across all connected social platforms." },
  { id: 5, name: "Tracker Agent", icon: "📊", status: "active", task: "Monitoring Campaign #4", cpu: 28, requests: 88, desc: "Real-time campaign monitoring, anomaly detection, performance alerts." },
  { id: 6, name: "Money Agent", icon: "💰", status: "active", task: "Calculating ROI reports", cpu: 19, requests: 45, desc: "Tracks affiliate earnings, calculates ROI, optimizes revenue streams." },
  { id: 7, name: "CEO Agent", icon: "👔", status: "active", task: "Reviewing daily summary", cpu: 55, requests: 12, desc: "Executive synthesizer — morning briefings, strategic recommendations." },
  { id: 8, name: "Optimizer Agent", icon: "⚡", status: "idle", task: "Standby", cpu: 2, requests: 0, desc: "A/B tests creatives, pauses underperformers, scales top campaigns." },
  { id: 9, name: "Voice Agent", icon: "🎤", status: "idle", task: "Standby", cpu: 1, requests: 0, desc: "Generates natural voiceovers in 5 languages, matched to platform tone." },
  { id: 10, name: "Competitor Agent", icon: "🕵️", status: "active", task: "Scanning rival campaigns", cpu: 31, requests: 67, desc: "Monitors competitor strategies and identifies market opportunities." },
];

export function AgentsPage() {
  const [agents, setAgents] = useState(AGENTS);
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleAgent = (id: number) => {
    setAgents(as => as.map(a => a.id === id ? { ...a, status: a.status === "active" ? "idle" : "active" } : a));
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🤖 AI Agents</h1>
          <p className="text-purple-400/60 text-xs mt-1">
            {agents.filter(a => a.status === "active").length} active · {agents.filter(a => a.status === "idle").length} idle
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">
          ⚡ Activate All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {agents.map(a => (
          <div key={a.id} className="card-os overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${a.status === "active" ? "gradient-purple" : "bg-gray-800"}`}>
                    {a.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{a.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-400" : "bg-gray-600"}`}
                        style={a.status === "active" ? { boxShadow: "0 0 6px #10b981" } : {}}></div>
                      <span className={`text-xs ${a.status === "active" ? "text-emerald-400" : "text-gray-500"}`}>
                        {a.status === "active" ? "Active" : "Idle"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAgent(a.id)}
                    className={`w-9 h-5 rounded-full transition-all relative ${a.status === "active" ? "bg-emerald-600" : "bg-gray-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${a.status === "active" ? "left-4" : "left-0.5"}`}></div>
                  </button>
                  <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                    className="text-purple-400 text-xs hover:text-purple-300">{expanded === a.id ? "▲" : "▼"}</button>
                </div>
              </div>

              <div className="text-xs text-purple-400/60 mb-2">↳ {a.task}</div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${a.cpu}%`, background: a.cpu > 60 ? "#f59e0b" : "#7c3aed" }}></div>
                </div>
                <span className="text-[10px] text-purple-400/60 w-10 text-right">CPU {a.cpu}%</span>
                <span className="text-[10px] text-purple-400/60 w-16 text-right">{a.requests} req/hr</span>
              </div>
            </div>

            {expanded === a.id && (
              <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                <p className="text-xs text-purple-300/70 mb-3 mt-3">{a.desc}</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg text-xs text-white gradient-purple">▶ Run Now</button>
                  <button className="px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30">✏️ Edit Prompt</button>
                  <button className="px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30">📋 View Logs</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
