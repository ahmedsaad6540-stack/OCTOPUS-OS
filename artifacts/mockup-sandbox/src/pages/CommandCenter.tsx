import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth";

const REVENUE_DATA = [
  { t: "00:00", v: 0 }, { t: "02:00", v: 12 }, { t: "04:00", v: 8 },
  { t: "06:00", v: 34 }, { t: "08:00", v: 67 }, { t: "10:00", v: 89 },
  { t: "12:00", v: 145 }, { t: "14:00", v: 178 }, { t: "16:00", v: 210 },
  { t: "18:00", v: 267 }, { t: "20:00", v: 312 }, { t: "22:00", v: 289 },
  { t: "Now", v: 334 },
];

const AGENTS = [
  { id: "brain",       name: "Brain",       icon: "🧠", status: "running",  task: "Analyzing 47 products",       cpu: 82 },
  { id: "trendhunter", name: "TrendHunter", icon: "🔥", status: "running",  task: "Scanning TikTok trends",       cpu: 61 },
  { id: "creator",     name: "Creator",     icon: "🎬", status: "idle",     task: "Waiting for Brain output",    cpu: 0  },
  { id: "publisher",   name: "Publisher",   icon: "📢", status: "running",  task: "Posting to 3 platforms",      cpu: 45 },
  { id: "tracker",     name: "Tracker",     icon: "👁",  status: "running",  task: "Tracking 156 links",          cpu: 23 },
  { id: "optimizer",   name: "Optimizer",   icon: "⚡", status: "running",  task: "Optimizing 2 campaigns",      cpu: 55 },
  { id: "money",       name: "Money",       icon: "💰", status: "running",  task: "Processing $334 revenue",     cpu: 12 },
  { id: "competitor",  name: "Competitor",  icon: "🕵️", status: "sleeping", task: "Scheduled at 18:00",          cpu: 0  },
  { id: "lab",         name: "Lab",         icon: "🧪", status: "running",  task: "A/B testing 4 hooks",         cpu: 39 },
  { id: "ceo",         name: "CEO",         icon: "👔", status: "running",  task: "Preparing daily brief",       cpu: 18 },
];

const AI_PROVIDERS = [
  { name: "OpenAI",   model: "gpt-4o",     status: "online",  latency: "312ms", priority: 1 },
  { name: "Gemini",   model: "gemini-pro", status: "online",  latency: "198ms", priority: 2 },
  { name: "Claude",   model: "claude-3",   status: "offline", latency: "—",     priority: 3 },
  { name: "DeepSeek", model: "v3",         status: "online",  latency: "445ms", priority: 4 },
];

const SOCIAL_STATUS = [
  { platform: "TikTok",    icon: "🎵", connected: true,  posts: 12, reach: "45K" },
  { platform: "YouTube",   icon: "📺", connected: true,  posts: 3,  reach: "12K" },
  { platform: "Instagram", icon: "📸", connected: true,  posts: 7,  reach: "8.4K" },
  { platform: "Pinterest", icon: "📌", connected: false, posts: 0,  reach: "—" },
  { platform: "X (Twitter)", icon: "🐦", connected: false, posts: 0, reach: "—" },
];

const ALERTS = [
  { type: "error",   msg: "Claude API offline — failover to DeepSeek active", time: "2m ago" },
  { type: "success", msg: "Campaign #4 hit $100 milestone — +23% vs yesterday", time: "14m ago" },
  { type: "info",    msg: "TrendHunter found 3 viral products in Health niche", time: "31m ago" },
  { type: "warning", msg: "Pinterest token expired — reconnection required", time: "1h ago" },
];

const ALERT_STYLE: Record<string, string> = {
  warning: "text-amber-300 bg-amber-900/20 border-amber-800/40",
  success: "text-emerald-300 bg-emerald-900/20 border-emerald-800/40",
  info:    "text-blue-300 bg-blue-900/20 border-blue-800/40",
  error:   "text-red-300 bg-red-900/20 border-red-800/40",
};
const ALERT_DOT: Record<string, string> = {
  warning: "bg-amber-400", success: "bg-emerald-400", info: "bg-blue-400", error: "bg-red-400",
};
const AGENT_STATUS_STYLE: Record<string, string> = {
  running:  "text-emerald-400 border-emerald-800/40 bg-emerald-900/20",
  idle:     "text-purple-400 border-purple-800/30 bg-purple-900/20",
  sleeping: "text-gray-500 border-gray-800/30 bg-gray-900/20",
};

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

function Dot({ on }: { on: boolean }) {
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${on ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" : "bg-gray-700"}`} />;
}

export function CommandCenter() {
  const { user } = useAuth();
  const clock = useClock();
  const [autonomous, setAutonomous] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [revenue, setRevenue] = useState(334);

  useEffect(() => {
    if (autonomous && !stopped) {
      const id = setInterval(() => setRevenue((r) => r + Math.floor(Math.random() * 4 + 1)), 2500);
      return () => clearInterval(id);
    }
    return undefined;
  }, [autonomous, stopped]);

  const greeting = clock.getHours() < 12 ? "morning" : clock.getHours() < 18 ? "afternoon" : "evening";
  const running = AGENTS.filter((a) => a.status === "running").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-purple-900/30 px-5 py-2.5 flex items-center justify-between bg-[#0d0920]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <p className="text-xs font-black text-white tracking-wider">🐙 COMMAND CENTER</p>
          <span className="text-[10px] text-purple-600 font-mono hidden sm:block">
            {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-white font-mono tabular-nums">
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border text-[10px] font-mono ${stopped ? "bg-red-900/20 border-red-800/40 text-red-400" : autonomous ? "bg-emerald-900/20 border-emerald-800/40 text-emerald-400" : "bg-[#130d2a] border-purple-900/30 text-purple-400"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${stopped ? "bg-red-400" : autonomous ? "bg-emerald-400 animate-pulse" : "bg-gray-600"}`} />
            {stopped ? "STOPPED" : autonomous ? "AUTO" : "STANDBY"}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* AI CEO Briefing */}
        <div className="bg-gradient-to-r from-[#180e30] to-[#0e1830] border border-purple-700/40 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-blue-800 flex items-center justify-center text-xl flex-shrink-0">👔</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI CEO — Daily Briefing</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-sm text-white leading-relaxed">
                Good {greeting}, <span className="text-purple-300 font-bold">{user?.name.split(" ")[0]}</span>.
                Revenue today is <span className="text-emerald-400 font-black">${revenue}</span> — on track to beat yesterday by 23%.
                <span className="text-red-300"> Claude API is offline</span>, DeepSeek failover is active.
                TrendHunter found <span className="text-purple-300 font-bold">3 high-potential Health products</span>.
                Recommend launching Campaign #7 within 2 hours for peak reach.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => { setStopped(false); setAutonomous((a) => !a); }}
                className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all border ${autonomous ? "bg-emerald-800/40 text-emerald-300 border-emerald-700/40" : "bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-transparent"}`}
              >
                {autonomous ? "⚡ AUTO ON" : "▶ Autonomous"}
              </button>
              <button
                onClick={() => { setAutonomous(false); setStopped(true); }}
                className="px-3 py-2 rounded-xl text-[11px] font-black bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-all"
              >
                🛑 Stop
              </button>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today's Revenue",  value: `$${revenue}`,   sub: "+23% vs yesterday",  icon: "💰", vc: "text-emerald-400", bc: "from-emerald-900/30 border-emerald-800/40" },
            { label: "Active Campaigns", value: "4",              sub: "2 performing above avg", icon: "📣", vc: "text-purple-300",  bc: "from-purple-900/30 border-purple-800/40" },
            { label: "Agents Running",   value: `${running}/10`, sub: "2 idle · 0 errors",   icon: "🤖", vc: "text-blue-300",    bc: "from-blue-900/30 border-blue-800/40" },
            { label: "Total Clicks",     value: "1,247",          sub: "CTR: 4.2%",           icon: "👆", vc: "text-amber-300",   bc: "from-amber-900/30 border-amber-800/40" },
          ].map(({ label, value, sub, icon, vc, bc }) => (
            <div key={label} className={`bg-gradient-to-br ${bc} border rounded-xl p-3`}>
              <div className="flex justify-between mb-1.5">
                <span className="text-lg">{icon}</span>
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${autonomous ? "bg-emerald-400 animate-pulse" : "bg-purple-900"}`} />
              </div>
              <p className={`text-xl font-black tabular-nums ${vc}`}>{value}</p>
              <p className="text-[10px] text-purple-600 mt-0.5">{label}</p>
              <p className="text-[9px] text-purple-500">{sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-purple-300">💰 Revenue Today</p>
              <p className="text-sm font-black text-emerald-400 font-mono">${revenue}</p>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1040" vertical={false} />
                <XAxis dataKey="t" stroke="#4c1d95" tick={{ fontSize: 9 }} interval={2} />
                <YAxis stroke="#4c1d95" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#130d2a", border: "1px solid #4c1d95", borderRadius: 8, fontSize: 10 }} />
                <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" name="Revenue $" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <p className="text-xs font-bold text-purple-300 mb-3">🚨 Live Alerts</p>
            <div className="space-y-2">
              {ALERTS.map(({ type, msg, time }, i) => (
                <div key={i} className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-[10px] ${ALERT_STYLE[type]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${ALERT_DOT[type]}`} />
                  <div>
                    <p className="leading-tight">{msg}</p>
                    <p className="opacity-50 mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agents + Providers + Social */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Agents */}
          <div className="lg:col-span-1 bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-purple-900/30 flex items-center justify-between">
              <p className="text-xs font-bold text-purple-300">🤖 Agents ({running}/10 active)</p>
            </div>
            <div className="divide-y divide-purple-900/20">
              {AGENTS.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-purple-900/10 transition-colors">
                  <span className="text-sm flex-shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-white">{a.name}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-mono flex-shrink-0 ${AGENT_STATUS_STYLE[a.status] ?? "text-gray-500 border-gray-800/30 bg-gray-900/20"}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-[9px] text-purple-700 truncate">{a.task}</p>
                    {a.cpu > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 bg-[#0d0920] rounded-full h-0.5">
                          <div className="h-0.5 rounded-full bg-purple-600" style={{ width: `${a.cpu}%` }} />
                        </div>
                        <span className="text-[8px] text-purple-800 font-mono">{a.cpu}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Providers + Social */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-purple-900/30">
                <p className="text-xs font-bold text-purple-300">⚡ AI Providers — Auto Failover Chain</p>
              </div>
              <div className="flex divide-x divide-purple-900/20">
                {AI_PROVIDERS.map((p, i) => (
                  <div key={p.name} className="flex-1 px-3 py-3 text-center relative">
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${p.status === "online" ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" : "bg-red-500"}`} />
                    <p className="text-xs font-bold text-white">{p.name}</p>
                    <p className="text-[9px] text-purple-600">{p.model}</p>
                    <p className={`text-[9px] font-mono mt-0.5 ${p.status === "online" ? "text-emerald-500" : "text-red-500"}`}>{p.latency}</p>
                    {p.status === "offline" && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] bg-red-900/40 text-red-400 border border-red-800/30 px-1 py-0.5 rounded font-mono">SKIP</span>
                    )}
                    {i < AI_PROVIDERS.length - 1 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-[10px] text-purple-700 z-10">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-purple-900/30">
                <p className="text-xs font-bold text-purple-300">🌐 Social Platforms</p>
              </div>
              <div className="grid grid-cols-5 divide-x divide-purple-900/20">
                {SOCIAL_STATUS.map((s) => (
                  <div key={s.platform} className="px-2 py-3 text-center">
                    <span className="text-lg block mb-1">{s.icon}</span>
                    <Dot on={s.connected} />
                    <p className="text-[8px] text-purple-500 mt-1 truncate">{s.platform.split(" ")[0]}</p>
                    {s.connected ? (
                      <p className="text-[8px] text-emerald-600">{s.posts} posts</p>
                    ) : (
                      <p className="text-[8px] text-red-600">Offline</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
              <p className="text-xs font-bold text-purple-300 mb-3">📅 Today's Mission</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Launch Campaign #7",         status: "pending",  priority: "High" },
                  { label: "Review TrendHunter report",  status: "done",     priority: "High" },
                  { label: "Reconnect Pinterest token",  status: "pending",  priority: "Critical" },
                  { label: "A/B test Hook variations",   status: "running",  priority: "Medium" },
                ].map(({ label, status, priority }) => (
                  <div key={label} className={`rounded-xl p-2.5 border text-left ${
                    status === "done"    ? "bg-emerald-900/10 border-emerald-800/30" :
                    status === "running" ? "bg-blue-900/10 border-blue-800/30" :
                    priority === "Critical" ? "bg-red-900/10 border-red-800/30" :
                    "bg-[#0d0920] border-purple-900/20"
                  }`}>
                    <p className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${priority === "Critical" ? "text-red-400" : priority === "High" ? "text-amber-400" : "text-purple-500"}`}>{priority}</p>
                    <p className="text-[11px] font-semibold text-white leading-snug">{label}</p>
                    <p className={`text-[9px] mt-0.5 font-mono ${status === "done" ? "text-emerald-400" : status === "running" ? "text-blue-400" : "text-purple-700"}`}>
                      {status === "done" ? "✓ Done" : status === "running" ? "⏳ Running" : "○ Pending"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
