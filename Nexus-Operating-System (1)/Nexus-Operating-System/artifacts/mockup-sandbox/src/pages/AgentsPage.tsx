import { useState } from "react";

interface Agent {
  name: string;
  icon: string;
  engine: string;
  desc: string;
  longDesc: string;
  status: "online" | "idle" | "error";
  tasks: number;
  skills: string[];
  lastRun?: string;
}

const AGENTS: Agent[] = [
  {
    name: "Brain", icon: "🧠", engine: "GPT-4o", status: "online", tasks: 3,
    desc: "Research & Strategy Coordinator",
    longDesc: "Master coordinator that analyzes markets, selects winning products, and orchestrates all other agents. The central intelligence of the OS.",
    skills: ["Product Research", "Market Analysis", "Competitor Scoring", "Strategy Planning"],
    lastRun: "2 minutes ago",
  },
  {
    name: "Creator", icon: "🎬", engine: "GPT-4o + DALL-E", status: "idle", tasks: 0,
    desc: "Content Generation Engine",
    longDesc: "Produces scripts, captions, hooks, CTAs, and visual briefs for any platform. Adapts tone for each social network automatically.",
    skills: ["Script Writing", "Hook Creation", "Caption Generation", "Hashtag Research"],
    lastRun: "1 hour ago",
  },
  {
    name: "Publisher", icon: "📢", engine: "Automation", status: "online", tasks: 7,
    desc: "Multi-Platform Publisher",
    longDesc: "Schedules and publishes content across all connected social platforms. Optimizes posting time based on audience analytics.",
    skills: ["Auto Publishing", "Schedule Optimization", "Cross-Platform", "Retry on Failure"],
    lastRun: "5 minutes ago",
  },
  {
    name: "Tracker", icon: "👁", engine: "Analytics", status: "online", tasks: 12,
    desc: "Click & Conversion Tracker",
    longDesc: "Monitors every click, conversion, and revenue event in real time. Generates UTM links and tracks the full customer journey.",
    skills: ["Click Tracking", "Conversion Events", "UTM Management", "Pixel Integration"],
    lastRun: "Real-time",
  },
  {
    name: "Optimizer", icon: "⚡", engine: "ML Model", status: "idle", tasks: 0,
    desc: "Performance Optimizer",
    longDesc: "Analyzes campaign performance and automatically adjusts budgets, creatives, and targeting to maximize ROI.",
    skills: ["A/B Testing", "Budget Optimization", "Audience Tuning", "Creative Rotation"],
    lastRun: "30 minutes ago",
  },
  {
    name: "Money", icon: "💰", engine: "Finance AI", status: "online", tasks: 2,
    desc: "Revenue Intelligence",
    longDesc: "Tracks all revenue streams, commissions, payouts, and profit margins. Sends daily financial reports and alerts on anomalies.",
    skills: ["Revenue Tracking", "Commission Calc", "Payout Alerts", "P&L Reports"],
    lastRun: "10 minutes ago",
  },
  {
    name: "Competitor", icon: "🕵️", engine: "Web Scraper", status: "idle", tasks: 0,
    desc: "Competitor Intelligence",
    longDesc: "Monitors top competitors 24/7. Detects viral content within minutes and reverse-engineers winning strategies.",
    skills: ["Ad Spy", "Viral Detection", "Product Tracking", "Price Monitoring"],
    lastRun: "2 hours ago",
  },
  {
    name: "TrendHunter", icon: "🔥", engine: "Trend API", status: "online", tasks: 5,
    desc: "Global Trend Radar",
    longDesc: "Scans TikTok, YouTube, Reddit, Twitter, and Google Trends for emerging opportunities before they peak.",
    skills: ["Trend Scanning", "Viral Prediction", "Hashtag Mining", "Niche Discovery"],
    lastRun: "15 minutes ago",
  },
  {
    name: "Lab", icon: "🧪", engine: "Experiment Engine", status: "idle", tasks: 0,
    desc: "A/B Testing Laboratory",
    longDesc: "Designs and runs controlled experiments on hooks, creatives, CTAs, and landing pages to find the highest-performing variants.",
    skills: ["Multivariate Tests", "Statistical Analysis", "Winner Selection", "Auto-Scale"],
    lastRun: "4 hours ago",
  },
  {
    name: "CEO", icon: "👔", engine: "Strategic AI", status: "online", tasks: 1,
    desc: "Autonomous CEO",
    longDesc: "The strategic mind of OCTOPUS. Reads all data, makes top-level decisions, and sends you a morning briefing with recommendations.",
    skills: ["Daily Briefing", "Strategic Planning", "Risk Assessment", "Team Coordination"],
    lastRun: "6:00 AM daily",
  },
];

const STATUS_CONFIG = {
  online: { color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/40", dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]", label: "Online" },
  idle: { color: "text-gray-400", bg: "bg-gray-900/20 border-gray-800/30", dot: "bg-gray-600", label: "Idle" },
  error: { color: "text-red-400", bg: "bg-red-900/20 border-red-800/40", dot: "bg-red-400", label: "Error" },
};

export function AgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🤖 AI Agents</h1>
            <p className="text-purple-400 text-sm mt-1">
              10 specialized agents — {AGENTS.filter(a => a.status === "online").length} online · {AGENTS.reduce((s, a) => s + a.tasks, 0)} tasks running
            </p>
          </div>
          <button className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
            🚀 Run All Agents
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent) => {
            const s = STATUS_CONFIG[agent.status];
            const isSelected = selected?.name === agent.name;
            return (
              <div
                key={agent.name}
                onClick={() => setSelected(isSelected ? null : agent)}
                className={`bg-[#130d2a] border rounded-xl p-5 cursor-pointer transition-all hover:border-purple-700/60 ${
                  isSelected ? "border-purple-600/80 shadow-lg shadow-purple-900/30" : "border-purple-900/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-800/60 to-indigo-800/40 border border-purple-700/30 flex items-center justify-center text-2xl flex-shrink-0">
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-white">{agent.name}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                      {agent.tasks > 0 && (
                        <span className="text-[10px] bg-purple-800/60 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                          {agent.tasks} tasks
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-300 font-medium">{agent.desc}</p>
                    <p className="text-[10px] text-purple-600 mt-1">Engine: {agent.engine}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <button className="text-[10px] text-purple-400 hover:text-white bg-purple-900/30 hover:bg-purple-800/40 px-2 py-1 rounded transition-all">
                      Run
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-purple-900/30">
                    <p className="text-xs text-purple-300 mb-3 leading-relaxed">{agent.longDesc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {agent.skills.map((skill) => (
                        <span key={skill} className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {agent.lastRun && (
                      <p className="text-[10px] text-purple-600">Last run: {agent.lastRun}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-bold py-2 rounded-lg">
                        ▶ Run Now
                      </button>
                      <button className="flex-1 bg-[#0d0920] text-purple-300 text-xs font-bold py-2 rounded-lg border border-purple-800/40 hover:border-purple-600">
                        ✍️ Edit Prompt
                      </button>
                      <button className="flex-1 bg-[#0d0920] text-purple-300 text-xs font-bold py-2 rounded-lg border border-purple-800/40 hover:border-purple-600">
                        📋 View Logs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
