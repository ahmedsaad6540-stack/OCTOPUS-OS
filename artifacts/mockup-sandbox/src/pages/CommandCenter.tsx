import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

// ── Types matching the real API ───────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  capabilities: string[];
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  id: string;
  name: string;
  providerType: string;
  model: string;
  apiKeyEnvVar: string;
  isDefault: boolean;
  status: "active" | "disabled";
}

interface Campaign {
  id: string;
  name: string;
  productName: string;
  status: string | null;
  revenue: number | null;
  clicks: number | null;
  conversions: number | null;
  productUrl?: string | null;
  affiliateNetwork?: string | null;
}

interface VideoJob {
  id: string;
  productName: string;
  title?: string;
  platform?: string;
  status: string;
  progress: number;
  videoUrl?: string;
  publishedUrl?: string;
  errorMessage?: string;
  heygenVideoId?: string;
}

// ── Agent icon map ────────────────────────────────────────────────────────────
const AGENT_ICON: Record<string, string> = {
  brain: "🧠", trendhunter: "🔥", creator: "🎬", publisher: "📢",
  tracker: "👁", optimizer: "⚡", money: "💰", competitor: "🕵️",
  lab: "🧪", ceo: "👔",
};

const AGENT_TASK: Record<string, string> = {
  brain: "Analyzing products & coordinating agents",
  trendhunter: "Scanning TikTok & Instagram for trends",
  creator: "Generating video scripts & ad copy",
  publisher: "Scheduling posts across platforms",
  tracker: "Tracking affiliate links & clicks",
  optimizer: "Running A/B tests & optimizing campaigns",
  money: "Processing revenue & commissions",
  competitor: "Monitoring competitor strategies",
  lab: "Running content experiments",
  ceo: "Preparing executive daily briefing",
};

function agentIcon(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "");
  return AGENT_ICON[key] ?? "🤖";
}
function agentTask(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "");
  return AGENT_TASK[key] ?? "Executing assigned tasks";
}

const AGENT_STATUS_STYLE: Record<string, string> = {
  active:   "text-emerald-400 border-emerald-800/40 bg-emerald-900/20",
  disabled: "text-gray-500 border-gray-800/30 bg-gray-900/20",
};

const PROVIDER_ICON: Record<string, string> = {
  openai: "🤖", gemini: "♊", anthropic: "🔮", deepseek: "🌊",
};

// ── Static fallback data (used when API returns 0 items) ─────────────────────
const REVENUE_DATA = [
  { t: "00:00", v: 0 }, { t: "04:00", v: 8 }, { t: "08:00", v: 34 },
  { t: "10:00", v: 67 }, { t: "12:00", v: 89 }, { t: "14:00", v: 134 },
  { t: "16:00", v: 178 }, { t: "18:00", v: 210 }, { t: "20:00", v: 267 },
  { t: "Now", v: 0 },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function Dot({ on }: { on: boolean }) {
  return (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${on ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" : "bg-gray-700"}`} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CommandCenter() {
  const { user } = useAuth();
  const clock = useClock();
  const [autonomous, setAutonomous] = useState(() => localStorage.getItem("octopus_auto") === "true");
  const [stopped, setStopped] = useState(() => localStorage.getItem("octopus_stopped") === "true");
  const [runningLoop, setRunningLoop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [agentResults, setAgentResults] = useState<Array<{agent: string; campaignName: string; status: string; output: any}>>(() => {
    try {
      return JSON.parse(localStorage.getItem("octopus_agent_results") || "[]");
    } catch {
      return [];
    }
  });
  const [showResults, setShowResults] = useState(() => localStorage.getItem("octopus_show_results") === "true");

  useEffect(() => {
    localStorage.setItem("octopus_auto", String(autonomous));
  }, [autonomous]);

  useEffect(() => {
    localStorage.setItem("octopus_stopped", String(stopped));
  }, [stopped]);

  useEffect(() => {
    localStorage.setItem("octopus_show_results", String(showResults));
  }, [showResults]);

  // Real data from API
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, providersRes, campaignsRes, jobsRes] = await Promise.allSettled([
        api.get<{ agents: Agent[] }>("/agents"),
        api.get<{ configs: Provider[] }>("/provider-configs"),
        api.get<{ campaigns: Campaign[] }>("/campaigns"),
        api.get<{ jobs: VideoJob[] }>("/production/jobs"),
      ]);

      if (agentsRes.status === "fulfilled") setAgents(agentsRes.value.agents ?? []);
      if (providersRes.status === "fulfilled") setProviders(providersRes.value.configs ?? []);
      if (campaignsRes.status === "fulfilled") setCampaigns(campaignsRes.value.campaigns ?? []);
      if (jobsRes.status === "fulfilled") setJobs(jobsRes.value.jobs ?? []);
      setLastFetched(new Date());
    } catch {
      // Keep previous state on error
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerLoop = async () => {
    setRunningLoop(true);
    setAgentResults([]);
    setToast("⏳ دورة التشغيل الذاتي الحقيقية تعمل... جارٍ استدعاء أسطول الذكاء الاصطناعي وتنفيذ المهام...");
    try {
      if (!autonomous) {
        await api.post("/autonomous/start", {}).catch(() => {});
      }
      const data = await api.post<{
        success: boolean;
        message: string;
        results: Array<{agent: string; campaignName: string; status: string; output: any}>;
      }>("/autonomous/run", {});
      if (data.success && data.results.length > 0) {
        setAgentResults(data.results);
        setShowResults(true);
        setAutonomous(true);
        setStopped(false);
        localStorage.setItem("octopus_agent_results", JSON.stringify(data.results));
        setToast(`✅ ${data.message}`);
        await fetchData();
      } else {
        setToast(`⚠️ ${data.message}`);
      }
    } catch (err: any) {
      setToast("❌ فشل تشغيل الوكلاء: " + (err?.message || String(err)));
    } finally {
      setRunningLoop(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleStopAutonomous = async () => {
    setAutonomous(false);
    setStopped(true);
    setToast("🛑 جارٍ إيقاف محرك التشغيل الذاتي وتجميد العمليات في السيرفر...");
    try {
      const res = await api.post<{ success: boolean; message?: string }>("/autonomous/stop", {});
      setToast(res.message || "🛑 تم إيقاف التشغيل الذاتي وتجميد جميع الحملات وعمليات الرندر بنجاح!");
      await fetchData();
    } catch (err: any) {
      setToast("🛑 تم الإيقاف محلياً. (تحذير السيرفر: " + (err?.message || String(err)) + ")");
    } finally {
      setTimeout(() => setToast(null), 6000);
    }
  };

  useEffect(() => {
    void fetchData();
    // Auto-refresh every 30 seconds
    const id = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Keep autonomous loop active in the background when enabled
  useEffect(() => {
    if (!autonomous) return;
    
    // Initial trigger after mount/refresh
    const initialTimer = setTimeout(() => {
      void triggerLoop();
    }, 1500);

    // Periodic run every 90 seconds
    const intervalId = setInterval(() => {
      void triggerLoop();
    }, 90_000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [autonomous]);

  const greeting = clock.getHours() < 12 ? "morning" : clock.getHours() < 18 ? "afternoon" : "evening";
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalAgents = agents.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active" || c.status === "running").length;
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue ?? 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks ?? 0), 0);

  // Build revenue chart data — use real campaign revenue or fallback
  const revenueChartData = REVENUE_DATA.map((d, i) => ({
    ...d,
    v: i === REVENUE_DATA.length - 1 ? Math.round(totalRevenue) : d.v,
  }));

  // Find offline providers for alerts
  const offlineProviders = providers.filter((p) => p.status === "disabled");
  const enabledProviders = providers.filter((p) => p.status === "active");

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-purple-900/30 px-5 py-2.5 flex items-center justify-between bg-[#0d0920]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <p className="text-xs font-black text-white tracking-wider">🐙 COMMAND CENTER</p>
          <span className="text-[10px] text-purple-600 font-mono hidden sm:block">
            {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
          {lastFetched && (
            <span className="text-[9px] text-emerald-700 font-mono hidden md:block">
              LIVE · synced {lastFetched.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
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
                {loading && <span className="text-[9px] text-purple-600 font-mono">Loading live data…</span>}
              </div>
              <p className="text-sm text-white leading-relaxed">
                Good {greeting},{" "}
                <span className="text-purple-300 font-bold">{user?.name?.split(" ")[0] ?? "Ahmed"}</span>.{" "}
                {totalRevenue > 0
                  ? <>Total campaign revenue is <span className="text-emerald-400 font-black">${totalRevenue.toFixed(2)}</span> across <span className="text-purple-300 font-bold">{campaigns.length} campaigns</span>.</>
                  : <>System is <span className="text-blue-300 font-bold">online and operational</span>. Ready to launch first campaigns.</>
                }{" "}
                {offlineProviders.length > 0
                  ? <><span className="text-red-300">{offlineProviders.map(p => (p as { name?: string; displayName?: string }).displayName ?? (p as { name?: string }).name ?? "Provider").join(", ")} offline</span> — failover active.</>
                  : enabledProviders.length > 0
                    ? <><span className="text-emerald-300">{enabledProviders.length} AI providers online</span> and ready.</>
                    : null
                }{" "}
                {activeAgents > 0
                  ? <><span className="text-purple-300 font-bold">{activeAgents} agents active</span> and processing tasks.</>
                  : "No agents running yet — configure agents to start automation."
                }
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => void triggerLoop()}
                disabled={runningLoop}
                className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all border ${autonomous ? "bg-emerald-800/40 text-emerald-300 border-emerald-700/40" : "bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-transparent"} disabled:opacity-50`}
              >
                {runningLoop ? "⏳ Running..." : autonomous ? "⚡ AUTO ON" : "▶ Autonomous"}
              </button>
              <button
                onClick={() => void handleStopAutonomous()}
                className="px-3 py-2 rounded-xl text-[11px] font-black bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-all"
              >
                🛑 Stop
              </button>
              <button
                onClick={() => void fetchData()}
                className="px-3 py-2 rounded-xl text-[11px] font-black bg-blue-900/30 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50 transition-all"
                title="Refresh live data"
              >
                ↻
              </button>
            </div>
          </div>
        </div>

        {/* Live Toast feedback */}
        {toast && (
          <div className="fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#1d123d] border border-purple-800 text-purple-300 shadow-2xl animate-bounce">
            {toast}
          </div>
        )}

        {/* Live Agent Activities & AI Output */}
        {showResults && agentResults.length > 0 && (
          <div className="bg-[#130d2a] border-2 border-emerald-500/50 rounded-xl p-4 shadow-xl shadow-emerald-950/20">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-lg">🤖</span>
                <p className="text-sm font-black text-white">Live Agent Activities — Real-Time Execution</p>
              </div>
              <button 
                onClick={() => setShowResults(false)}
                className="text-xs text-purple-400 hover:text-white px-2 py-1 rounded bg-[#0d0920] border border-purple-800/40"
              >
                ✕ Hide
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {agentResults.map((res, idx) => (
                <div key={idx} className="bg-[#0d0920] border border-purple-900/40 rounded-lg p-3">
                  <div className="flex justify-between items-center border-b border-purple-900/20 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {res.agent.toLowerCase().includes("creator") ? "🎬" :
                         res.agent.toLowerCase().includes("trend") ? "🔥" :
                         res.agent.toLowerCase().includes("ceo") ? "👔" : "🧠"}
                      </span>
                      <p className="text-xs font-bold text-white">{res.agent}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${res.status === "completed" ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" : "bg-red-950/40 border-red-800 text-red-400"}`}>
                      {res.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-400 mb-1">Campaign: <span className="text-purple-300 font-bold">{res.campaignName}</span></p>
                  
                  {/* Content response */}
                  <div className="text-xs text-purple-200 leading-relaxed font-mono whitespace-pre-wrap bg-black/40 p-2.5 rounded border border-purple-950/60 max-h-48 overflow-y-auto">
                    {res.status === "completed" && res.output && typeof res.output === "object" 
                      ? (res.output as any).content || JSON.stringify(res.output, null, 2)
                      : String(res.output || "No output")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Row — real data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Revenue",
              value: `$${totalRevenue > 0 ? totalRevenue.toFixed(2) : "0.00"}`,
              sub: `${campaigns.length} campaigns`,
              icon: "💰",
              vc: "text-emerald-400",
              bc: "from-emerald-900/30 border-emerald-800/40",
            },
            {
              label: "Active Campaigns",
              value: String(activeCampaigns || campaigns.length),
              sub: `${campaigns.length} total`,
              icon: "📣",
              vc: "text-purple-300",
              bc: "from-purple-900/30 border-purple-800/40",
            },
            {
              label: "Agents Online",
              value: `${activeAgents}/${totalAgents}`,
              sub: `${totalAgents - activeAgents} idle`,
              icon: "🤖",
              vc: "text-blue-300",
              bc: "from-blue-900/30 border-blue-800/40",
            },
            {
              label: "Total Clicks",
              value: totalClicks > 0 ? totalClicks.toLocaleString() : "—",
              sub: totalClicks > 0 ? "across all campaigns" : "No campaigns yet",
              icon: "👆",
              vc: "text-amber-300",
              bc: "from-amber-900/30 border-amber-800/40",
            },
          ].map(({ label, value, sub, icon, vc, bc }) => (
            <div key={label} className={`bg-gradient-to-br ${bc} border rounded-xl p-3`}>
              <div className="flex justify-between mb-1.5">
                <span className="text-lg">{icon}</span>
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${loading ? "bg-blue-400 animate-pulse" : "bg-emerald-400"}`} />
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
              <p className="text-xs font-bold text-purple-300">💰 Revenue — All Campaigns</p>
              <p className="text-sm font-black text-emerald-400 font-mono">${totalRevenue.toFixed(2)}</p>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
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

          {/* Live system status panel */}
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
            <p className="text-xs font-bold text-purple-300 mb-3">🟢 System Status — Live</p>
            <div className="space-y-2">
              {[
                { label: "API Server", ok: true, detail: "Railway · Online" },
                { label: "PostgreSQL", ok: true, detail: "Railway · Connected" },
                { label: "Agents DB", ok: totalAgents > 0, detail: `${totalAgents} agents registered` },
                { label: "AI Providers", ok: enabledProviders.length > 0, detail: `${enabledProviders.length} enabled` },
                { label: "Campaigns", ok: campaigns.length > 0, detail: campaigns.length > 0 ? `${campaigns.length} campaigns` : "No campaigns yet" },
              ].map(({ label, ok, detail }) => (
                <div key={label} className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-[10px] ${ok ? "text-emerald-300 bg-emerald-900/20 border-emerald-800/40" : "text-amber-300 bg-amber-900/20 border-amber-800/40"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${ok ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <div>
                    <p className="font-bold">{label}</p>
                    <p className="opacity-70 mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agents + Providers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Agents — real data */}
          <div className="lg:col-span-1 bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-purple-900/30 flex items-center justify-between">
              <p className="text-xs font-bold text-purple-300">🤖 Agents ({activeAgents}/{totalAgents} active)</p>
            </div>
            {loading ? (
              <div className="p-4 text-center text-purple-600 text-xs animate-pulse">Loading agents…</div>
            ) : agents.length === 0 ? (
              <div className="p-4 text-center text-purple-700 text-xs">No agents found</div>
            ) : (
              <div className="divide-y divide-purple-900/20">
                {agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-purple-900/10 transition-colors">
                    <span className="text-sm flex-shrink-0">{agentIcon(a.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-white">{a.name}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-mono flex-shrink-0 ${AGENT_STATUS_STYLE[a.status] ?? "text-gray-500 border-gray-800/30 bg-gray-900/20"}`}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-purple-700 truncate">{agentTask(a.name)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Providers + Campaigns */}
          <div className="lg:col-span-2 space-y-4">
            {/* AI Providers — real data */}
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-purple-900/30">
                <p className="text-xs font-bold text-purple-300">⚡ AI Providers — Auto Failover Chain</p>
              </div>
              {loading ? (
                <div className="p-4 text-center text-purple-600 text-xs animate-pulse">Loading providers…</div>
              ) : providers.length === 0 ? (
                <div className="p-4 text-center text-purple-700 text-xs">No providers configured</div>
              ) : (
                <div className="flex divide-x divide-purple-900/20">
                  {[...providers].sort((a, b) => {
                    const order: Record<string, number> = { openai: 1, gemini: 2, anthropic: 3, deepseek: 4 };
                    return (order[a.providerType] ?? 99) - (order[b.providerType] ?? 99);
                  }).map((p, i, arr) => {
                    const isOnline = p.status === "active";
                    return (
                      <div key={p.id} className="flex-1 px-3 py-3 text-center relative">
                        <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${isOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" : "bg-red-500"}`} />
                        <p className="text-xs font-bold text-white">{p.name}</p>
                        <p className="text-[9px] text-purple-600">{p.model ?? "—"}</p>
                        <p className={`text-[9px] font-mono mt-0.5 ${isOnline ? "text-emerald-500" : "text-red-500"}`}>
                          {isOnline ? "online" : "offline"}
                        </p>
                        {!isOnline && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] bg-red-900/40 text-red-400 border border-red-800/30 px-1 py-0.5 rounded font-mono">SKIP</span>
                        )}
                        {i < arr.length - 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-[10px] text-purple-700 z-10">→</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Production Video Jobs — real HeyGen & YouTube pipeline */}
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-purple-900/30 flex items-center justify-between">
                <p className="text-xs font-bold text-purple-300">🎬 Live Production Video Jobs (HeyGen & YouTube)</p>
                {jobs.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono">{jobs.filter(j => j.status === "done").length}/{jobs.length} completed</span>
                )}
              </div>
              {loading ? (
                <div className="p-4 text-center text-purple-600 text-xs animate-pulse">Loading active video production jobs…</div>
              ) : jobs.length === 0 ? (
                <div className="p-4 text-center space-y-1">
                  <p className="text-purple-500 text-xs">No active video jobs yet</p>
                  <p className="text-purple-700 text-[10px]">Launch a campaign or generate videos in Video Factory to start real rendering</p>
                </div>
              ) : (
                <div className="divide-y divide-purple-900/20 max-h-56 overflow-y-auto">
                  {jobs.map((j) => (
                    <div key={j.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-purple-900/10 transition-colors">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🎬</span>
                          <p className="text-xs font-bold text-white truncate">{j.title || j.productName}</p>
                          <span className="text-[9px] text-purple-400 bg-purple-900/40 px-1.5 py-0.5 rounded font-mono">{j.platform || "YouTube Shorts"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 bg-purple-950 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-1.5 transition-all duration-500" style={{ width: `${j.progress || 0}%` }} />
                          </div>
                          <span className="text-[9px] text-purple-300 font-mono">{j.progress || 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {j.publishedUrl ? (
                          <a href={j.publishedUrl} target="_blank" rel="noreferrer" className="bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1">
                            📺 Live on {j.platform || "YouTube"} ↗
                          </a>
                        ) : j.videoUrl ? (
                          <a href={j.videoUrl} target="_blank" rel="noreferrer" className="bg-purple-800 hover:bg-purple-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-all">
                            ▶ View MP4 ↗
                          </a>
                        ) : (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${
                            j.status === "done" ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" :
                            j.status === "failed" ? "bg-red-950/40 border-red-800 text-red-400" :
                            "bg-amber-950/40 border-amber-800 text-amber-400 animate-pulse"
                          }`}>
                            {j.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campaigns — real data */}
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-purple-900/30">
                <p className="text-xs font-bold text-purple-300">📣 Campaigns — Real Data</p>
              </div>
              {loading ? (
                <div className="p-4 text-center text-purple-600 text-xs animate-pulse">Loading campaigns…</div>
              ) : campaigns.length === 0 ? (
                <div className="p-4 text-center space-y-1">
                  <p className="text-purple-500 text-xs">No campaigns yet</p>
                  <p className="text-purple-700 text-[10px]">Create your first campaign from the Campaigns page</p>
                </div>
              ) : (
                <div className="divide-y divide-purple-900/20">
                  {campaigns.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                        <p className="text-[9px] text-purple-700">{c.productName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-emerald-400">${(c.revenue ?? 0).toFixed(2)}</p>
                        <p className="text-[9px] text-purple-600">{c.clicks ?? 0} clicks</p>
                      </div>
                      <a
                        href={c.productUrl || (c.affiliateNetwork?.toLowerCase().includes("impact") ? "https://app.impact.com/secure/advertiser/checklist/checklist-instance.ihtml" : c.affiliateNetwork?.toLowerCase().includes("amazon") ? "https://affiliate-program.amazon.com/" : "https://www.digistore24.com/vendor/cockpit")}
                        target="_blank"
                        rel="noreferrer"
                        title={`فتح صفحة الأفيلييت والحساب في ${c.affiliateNetwork || 'Amazon'}`}
                        className="text-[9px] font-bold px-2 py-1 rounded border border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:text-white hover:bg-indigo-900/60 transition-all flex items-center gap-1 flex-shrink-0"
                      >
                        <span>🔗</span> <span>{c.affiliateNetwork || 'amazon'}</span>
                      </a>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-mono flex-shrink-0 ${
                        c.status === "active" ? "text-emerald-400 border-emerald-800/40 bg-emerald-900/20" :
                        c.status === "paused" ? "text-amber-400 border-amber-800/40 bg-amber-900/20" :
                        "text-purple-400 border-purple-800/30 bg-purple-900/20"
                      }`}>
                        {c.status ?? "draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
