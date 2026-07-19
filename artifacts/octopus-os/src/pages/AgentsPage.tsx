import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { API_BASE } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: "active" | "disabled";
  task: string;
  cpu: number;
  requests: number;
  description: string;
}

const DEFAULT_AGENTS = [
  { name: "Brain Agent", icon: "🧠", task: "Analyzing trending niches", cpu: 42, requests: 892, desc: "Central intelligence — synthesizes all data, drives strategic decisions." },
  { name: "TrendHunter", icon: "📈", task: "Scanning TikTok trends", cpu: 67, requests: 234, desc: "Detects viral trends 48h early across TikTok, YouTube, and Instagram." },
  { name: "Creator Agent", icon: "✍️", task: "Writing video scripts", cpu: 38, requests: 156, desc: "Generates unique, platform-optimized video scripts and content." },
  { name: "Publisher Agent", icon: "📢", task: "Schedules and publishes", cpu: 5, requests: 92, desc: "Schedules and publishes content across all connected social platforms." },
  { name: "Tracker Agent", icon: "📊", task: "Monitoring Campaign #1", cpu: 28, requests: 88, desc: "Real-time campaign monitoring, anomaly detection, performance alerts." },
  { name: "Money Agent", icon: "💰", task: "Calculating ROI reports", cpu: 19, requests: 45, desc: "Tracks affiliate earnings, calculates ROI, optimizes revenue streams." },
];

function getIconForAgent(name: string): string {
  if (name.includes("Brain")) return "🧠";
  if (name.includes("Trend")) return "📈";
  if (name.includes("Creator")) return "✍️";
  if (name.includes("Publisher")) return "📢";
  if (name.includes("Tracker")) return "📊";
  if (name.includes("Money")) return "💰";
  return "🤖";
}

export function AgentsPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", instructions: "", capabilities: "brain, research" });
  const [creating, setCreating] = useState(false);

  const handleCreateAgent = async () => {
    if (!createForm.name.trim() || !createForm.instructions.trim() || !token) return;
    setCreating(true);
    try {
      const caps = createForm.capabilities.split(",").map(c => c.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || "Custom AI Agent",
          instructions: createForm.instructions,
          capabilities: caps.length > 0 ? caps : ["custom"],
          status: "active"
        })
      });
      if (res.ok) {
        setCreateModal(false);
        setCreateForm({ name: "", description: "", instructions: "", capabilities: "brain, research" });
        await fetchAgents();
        alert("✅ تم إنشاء الوكيل في قاعدة البيانات بنجاح!");
      } else {
        alert("❌ فشل إنشاء الوكيل");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const fetchAgents = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (data.length > 0) {
        setAgents(data.map((w: any) => ({
          id: w.id,
          name: w.name,
          icon: getIconForAgent(w.name),
          status: w.status === "active" ? "active" : "disabled",
          task: w.status === "active" ? "Running operations loop" : "Idle",
          cpu: w.status === "active" ? Math.floor(Math.random() * 50) + 20 : 0,
          requests: w.status === "active" ? Math.floor(Math.random() * 200) + 10 : 0,
          description: w.description || "Virtual Agent"
        })));
      } else {
        // Seed default agents in database
        for (const agent of DEFAULT_AGENTS) {
          await fetch(`${API_BASE}/agents`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              name: agent.name,
              instructions: agent.desc,
              description: agent.desc,
              status: "active"
            })
          });
        }
        // Fetch again
        const reFetch = await fetch(`${API_BASE}/agents`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (reFetch.ok) {
          const freshData = await reFetch.json();
          setAgents(freshData.map((w: any) => ({
            id: w.id,
            name: w.name,
            icon: getIconForAgent(w.name),
            status: w.status === "active" ? "active" : "disabled",
            task: "Running operations loop",
            cpu: Math.floor(Math.random() * 50) + 20,
            requests: Math.floor(Math.random() * 200) + 10,
            description: w.description || "Virtual Agent"
          })));
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback to default agents if API unreachable
      setAgents(DEFAULT_AGENTS.map((a, i) => ({
        id: `local-${i}`,
        name: a.name,
        icon: a.icon,
        status: "active" as const,
        task: a.task,
        cpu: a.cpu,
        requests: a.requests,
        description: a.desc
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [token]);

  const toggleAgent = async (id: string, currentStatus: string) => {
    if (!token) return;
    const isActivating = currentStatus !== "active";
    const endpoint = `${API_BASE}/agents/${id}/${isActivating ? "enable" : "disable"}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAgents(prev => prev.map(a => a.id === id ? {
          ...a,
          status: isActivating ? "active" : "disabled",
          cpu: isActivating ? 25 : 0,
          requests: isActivating ? 10 : 0
        } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [executionModal, setExecutionModal] = useState<{ title: string; steps: Array<{ agentName: string; status: "running" | "done" | "error"; logs?: string[]; result?: any; text?: string; error?: string }> } | null>(null);

  const runAgentNow = async (id: string) => {
    if (!token) return;
    const targetAgent = agents.find(a => a.id === id);
    setExecutionModal({
      title: `⚡ تشغيل فوري للوكيل: ${targetAgent?.name || id}`,
      steps: [{ agentName: targetAgent?.name || id, status: "running" }]
    });
    try {
      const res = await fetch(`${API_BASE}/agents/${id}/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: `أنت وكيل ${targetAgent?.name || "AI"} النشط. قم بتحليل حالة النظام وقدم تقريراً وتوصيات عملية للتحسين الفوري.` })
      });
      const data = await res.json();
      const out = data.run?.output || {};
      const isErr = !res.ok || data.run?.status === "failed" || data.run?.error || out.error;

      setExecutionModal(prev => prev ? {
        ...prev,
        steps: [{
          agentName: targetAgent?.name || id,
          status: isErr ? "error" : "done",
          logs: out.actionLogs || [],
          result: out.realExecutionResult || null,
          text: out.content || String(out || ""),
          error: data.run?.error || out.error
        }]
      } : null);

      fetchAgents();
    } catch (err: any) {
      setExecutionModal(prev => prev ? {
        ...prev,
        steps: [{ agentName: targetAgent?.name || id, status: "error", error: err?.message || String(err) }]
      } : null);
      console.error(err);
    }
  };

  const runAllNow = async () => {
    if (!token) return;
    const active = agents.filter(a => a.status === "active");
    if (!active.length) { alert("لا يوجد وكلاء نشطون حالياً!"); return; }

    setExecutionModal({
      title: `⚡ تشغيل أسطول وكلاء الذكاء الاصطناعي (${active.length} وكيل نشط)`,
      steps: active.map(a => ({ agentName: a.name, status: "running" }))
    });

    for (let i = 0; i < active.length; i++) {
      const agent = active[i];
      try {
        const res = await fetch(`/api/agents/${agent.id}/invoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ prompt: `أنت وكيل ${agent.name} النشط. قم بتحليل حالة النظام وقدم تقريراً وتوصيات عملية للتحسين الفوري.` })
        });
        const data = await res.json();
        const out = data.run?.output || {};
        const isErr = !res.ok || data.run?.status === "failed" || data.run?.error || out.error;

        setExecutionModal(prev => {
          if (!prev) return null;
          const nextSteps = [...prev.steps];
          nextSteps[i] = {
            agentName: agent.name,
            status: isErr ? "error" : "done",
            logs: out.actionLogs || [],
            result: out.realExecutionResult || null,
            text: out.content || String(out || ""),
            error: data.run?.error || out.error
          };
          return { ...prev, steps: nextSteps };
        });
      } catch (e: any) {
        setExecutionModal(prev => {
          if (!prev) return null;
          const nextSteps = [...prev.steps];
          nextSteps[i] = { agentName: agent.name, status: "error", error: e?.message || String(e) };
          return { ...prev, steps: nextSteps };
        });
      }
    }
    fetchAgents();
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#06020f" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">🤖 AI Agents</h1>
          <p className="text-purple-400/60 text-xs mt-1">
            {agents.filter(a => a.status === "active").length} {t("active")} · {agents.filter(a => a.status === "disabled").length} {t("disabled")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCreateModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-900/40 hover:opacity-90 transition-all font-sans flex items-center gap-1.5">
            + إضافة وكيل جديد
          </button>
          <button onClick={() => void runAllNow()} className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-purple shadow-lg shadow-purple-900/40 hover:opacity-90 transition-all font-sans flex items-center gap-1.5">
            🚀 تشغيل الكل (Run All)
          </button>
          <button onClick={fetchAgents} className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-sans">
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
          Loading AI Agents...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map(a => (
            <div key={a.id} className="glass-card overflow-hidden rounded-2xl border border-purple-950/60 flex flex-col justify-between">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${a.status === "active" ? "gradient-purple glow-purple" : "bg-gray-800/80"}`}>
                      {a.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-heading">{a.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-400" : "bg-gray-600"}`}
                          style={a.status === "active" ? { boxShadow: "0 0 6px #10b981" } : {}}></div>
                        <span className={`text-[10px] uppercase font-bold ${a.status === "active" ? "text-emerald-400" : "text-gray-500"}`}>
                          {t(a.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => toggleAgent(a.id, a.status)}
                      className={`w-9 h-5 rounded-full transition-all relative ${a.status === "active" ? "bg-purple-600" : "bg-gray-700"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${a.status === "active" ? "left-4" : "left-0.5"}`}></div>
                    </button>
                    <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                      className="text-purple-400 text-xs hover:text-purple-300 transition-all font-sans">{expanded === a.id ? "▲" : "▼"}</button>
                  </div>
                </div>

                <div className="text-xs text-purple-400/60 mb-3 font-mono">↳ {a.task}</div>

                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-purple-950/40">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${a.cpu}%`, background: a.cpu > 60 ? "#ef4444" : "#7c3aed" }}></div>
                  </div>
                  <span className="text-purple-400/60 w-12 text-right font-mono">CPU {a.cpu}%</span>
                  <span className="text-purple-400/60 w-16 text-right font-mono">{a.requests} req/hr</span>
                </div>
              </div>

              {expanded === a.id && (
                <div className="px-5 pb-5 pt-4 border-t border-purple-950/60 bg-purple-950/5">
                  <p className="text-xs text-purple-300/70 mb-4 leading-relaxed font-sans">{a.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => runAgentNow(a.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-white gradient-purple font-sans">▶ Run Now</button>
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-purple-300 border border-purple-500/20 hover:bg-purple-950/30 transition-all font-sans">✏️ Edit Prompt</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Live Execution Center Modal */}
      {executionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0f0a24] border-2 border-purple-600/60 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-purple-900/40">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="animate-pulse">⚡</span> {executionModal.title}
                </h3>
                <p className="text-[11px] text-purple-300 mt-0.5 font-mono">
                  مركز العمليات والتنفيذ المباشر لوكلاء الذكاء الاصطناعي (Real-Time Operations Hub)
                </p>
              </div>
              <button 
                onClick={() => setExecutionModal(null)} 
                className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900 transition-all text-sm font-bold"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {executionModal.steps.map((step, idx) => (
                <div key={idx} className={`rounded-2xl p-4 border transition-all ${
                  step.status === "running" ? "bg-purple-950/30 border-purple-500/50 animate-pulse" :
                  step.status === "error" ? "bg-red-950/20 border-red-500/50" :
                  "bg-gradient-to-r from-[#140e2e]/90 to-[#1a123e]/90 border-emerald-500/50 shadow-lg"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                        step.status === "running" ? "bg-purple-600 text-white animate-spin" :
                        step.status === "error" ? "bg-red-600 text-white" : "bg-emerald-500 text-black font-black"
                      }`}>
                        {step.status === "running" ? "⏳" : step.status === "error" ? "✕" : "✓"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">{step.agentName}</h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          step.status === "running" ? "bg-purple-900/60 text-purple-300" :
                          step.status === "error" ? "bg-red-900/60 text-red-300" : "bg-emerald-900/60 text-emerald-300 font-bold"
                        }`}>
                          {step.status === "running" ? "جارٍ تنفيذ المهام التشغيلية..." :
                           step.status === "error" ? "فشل التنفيذ" : "تم التنفيذ وإنجاز المهمة بنجاح ✅"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {step.logs && step.logs.length > 0 && (
                    <div className="bg-black/50 rounded-xl p-3 border border-purple-900/40 space-y-1.5 mb-3 font-mono text-[11px]">
                      <div className="text-[10px] text-purple-400 font-bold uppercase border-b border-purple-900/30 pb-1 mb-1">
                        🖥️ سجل العمليات المباشرة (Live Action Logs):
                      </div>
                      {step.logs.map((l, li) => (
                        <div key={li} className="text-purple-200 flex items-start gap-1.5">
                          <span className="text-purple-500 mt-0.5">›</span>
                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.result && (
                    <div className="bg-[#0b071a] rounded-xl p-3 border border-emerald-700/40 mb-3 text-xs space-y-2">
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 border-b border-emerald-900/30 pb-1">
                        <span>🎯 مخرجات المهمة التشغيلية (Execution Summary):</span>
                      </div>
                      {step.result.taskExecuted && (
                        <div className="text-gray-300 flex justify-between font-mono text-[11px]">
                          <span className="text-gray-400">الوظيفة المنجزة:</span>
                          <span className="text-emerald-300 font-bold">{step.result.taskExecuted}</span>
                        </div>
                      )}
                      {step.result.discoveredCount !== undefined && (
                        <div className="text-gray-300 flex justify-between font-mono text-[11px]">
                          <span className="text-gray-400">المنتجات المكتشفة:</span>
                          <span className="text-purple-300 font-bold">{step.result.discoveredCount} منتج رائج</span>
                        </div>
                      )}
                      {step.result.jobId && (
                        <div className="text-gray-300 flex justify-between font-mono text-[11px]">
                          <span className="text-gray-400">معرف وظيفة الفيديو (Job ID):</span>
                          <span className="text-amber-300 font-mono">{String(step.result.jobId).slice(0, 12)}...</span>
                        </div>
                      )}
                      {step.result.topPicks && Array.isArray(step.result.topPicks) && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t border-purple-900/30">
                          <div className="text-[10px] text-purple-300 font-bold">أفضل التوصيات المرشحة للحملات:</div>
                          {step.result.topPicks.map((p: any, pi: number) => (
                            <div key={pi} className="bg-purple-950/40 p-2 rounded-lg border border-purple-800/30 flex justify-between items-center text-[11px]">
                              <span className="text-white font-medium truncate max-w-[280px]">{p.name}</span>
                              <span className="text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">${p.epc} EPC</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step.text && (
                    <div className="bg-purple-950/20 rounded-xl p-3 border border-purple-800/30 text-[11px] text-purple-200 font-sans leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                      <div className="text-[10px] text-purple-400 font-bold mb-1 font-mono">📝 تقرير الوكيل الاستراتيجي:</div>
                      {step.text}
                    </div>
                  )}

                  {step.error && (
                    <div className="bg-red-950/40 rounded-xl p-3 border border-red-600/50 text-[11px] text-red-300 font-mono mt-2">
                      ❌ خطأ التنفيذ: {step.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-purple-800/40 flex justify-end gap-3">
              <button
                onClick={() => { setExecutionModal(null); fetchAgents(); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50 transition-all font-sans"
              >
                إغلاق وتحديث حالة النظام 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#130d2a] border border-emerald-600/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-emerald-950/40">
            <div className="flex items-center justify-between mb-4 border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="text-sm font-black text-white">إضافة وكيل ذكاء اصطناعي جديد</h3>
                  <p className="text-[10px] text-emerald-400">سيتم حفظ وكيلك المخصص في قاعدة بيانات PostgreSQL</p>
                </div>
              </div>
              <button onClick={() => setCreateModal(false)} className="text-purple-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-purple-300 block mb-1">اسم الوكيل (Agent Name) *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="مثال: TikTok Viral Scriptwriter"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-purple-300 block mb-1">الوصف المختصر (Description)</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="مثال: يولد نصوص فيديو تيك توك وتوصيات إعلانية سريعة..."
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-purple-300 block mb-1">التعليمات / التلقين الأساسي (System Instructions) *</label>
                <textarea
                  value={createForm.instructions}
                  onChange={e => setCreateForm({ ...createForm, instructions: e.target.value })}
                  rows={5}
                  placeholder="أنت خبير تسويق محتوى ومسؤول عن كتابة نصوص فيروسية..."
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-purple-300 block mb-1">القدرات / العلامات (Capabilities - مفصولة بفاصلة)</label>
                <input
                  type="text"
                  value={createForm.capabilities}
                  onChange={e => setCreateForm({ ...createForm, capabilities: e.target.value })}
                  placeholder="brain, research, content, tiktok"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 pt-3 border-t border-purple-900/40">
              <button
                onClick={() => void handleCreateAgent()}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg disabled:opacity-50 transition-all"
              >
                {creating ? "⏳ جارٍ الإنشاء والحفظ..." : "🚀 حفظ وإنشاء الوكيل الآن"}
              </button>
              <button
                onClick={() => setCreateModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-800/60 text-gray-400 hover:bg-gray-800 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
