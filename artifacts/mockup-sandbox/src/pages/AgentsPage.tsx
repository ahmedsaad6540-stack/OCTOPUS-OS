import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types matching real /agents API ──────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  capabilities: string[];
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

// ── Static icons / descriptions per agent name ───────────────────────────────
const AGENT_ICONS: Record<string, string> = {
  brain: "🧠", creator: "🎬", publisher: "📢", tracker: "👁",
  optimizer: "⚡", money: "💰", competitor: "🕵️", trendhunter: "🔥",
  lab: "🧪", ceo: "👔",
};
const AGENT_ENGINE: Record<string, string> = {
  brain: "GPT-4o", creator: "GPT-4o + DALL-E", publisher: "Automation",
  tracker: "Analytics", optimizer: "ML Model", money: "Finance AI",
  competitor: "Web Scraper", trendhunter: "Trend API",
  lab: "Experiment Engine", ceo: "Strategic AI",
};

function agentKey(name: string) { return name.toLowerCase().replace(/\s+/g, ""); }

export function AgentsPage() {
  const [agents, setAgents]         = useState<Agent[]>([]);
  const [selected, setSelected]     = useState<Agent | null>(null);
  const [editModal, setEditModal]   = useState<Agent | null>(null);
  const [logsModal, setLogsModal]   = useState<Agent | null>(null);
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [runningId, setRunningId]   = useState<string | null>(null);
  const [editInstr, setEditInstr]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [runs, setRuns]             = useState<any[]>([]);

  // Create Agent State
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    instructions: "",
    capabilities: "brain, research, content"
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Create Agent ──────────────────────────────────────────────────────────
  const createAgent = async () => {
    if (!createForm.name.trim() || !createForm.instructions.trim()) {
      showToast("❌ اسم الوكيل والتعليمات مطلوبان", false);
      return;
    }
    setCreating(true);
    try {
      const caps = createForm.capabilities.split(",").map(c => c.trim()).filter(Boolean);
      const res = await api.post<{ agent: Agent }>("/agents", {
        name: createForm.name,
        description: createForm.description || "Custom AI Agent",
        instructions: createForm.instructions,
        capabilities: caps.length > 0 ? caps : ["custom"],
        status: "active"
      });
      if (res.agent) {
        setAgents(prev => [res.agent, ...prev]);
        setCreateModal(false);
        setCreateForm({ name: "", description: "", instructions: "", capabilities: "brain, research, content" });
        showToast(`✅ تم إنشاء وكيل "${res.agent.name}" وحفظه في قاعدة البيانات بنجاح!`, true);
      }
    } catch (err: any) {
      showToast(`❌ فشل إنشاء الوكيل: ${err?.message || String(err)}`, false);
    } finally {
      setCreating(false);
    }
  };

  // ── Load agents from API ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ agents: Agent[] }>("/agents");
      setAgents(data.agents ?? []);
    } catch {
      showToast("تعذّر تحميل الوكلاء", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Toggle agent status (active ↔ disabled) ───────────────────────────────
  const toggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === "active" ? "disabled" : "active";
    try {
      const data = await api.put<{ agent: Agent }>(`/agents/${agent.id}`, { status: newStatus });
      setAgents(prev => prev.map(a => a.id === agent.id ? data.agent : a));
      if (selected?.id === agent.id) setSelected(data.agent);
      showToast(newStatus === "active" ? "✅ الوكيل مُفعَّل" : "⏸ الوكيل مُوقَف", true);
    } catch {
      showToast("❌ فشل تغيير الحالة", false);
    }
  };

  const [executionModal, setExecutionModal] = useState<{ title: string; steps: Array<{ agentName: string; status: "running" | "done" | "error"; logs?: string[]; result?: any; text?: string; error?: string }> } | null>(null);

  // ── Run agent (trigger via Real Agent Invoke API) ─────────────────────────
  const runAgent = async (agent: Agent) => {
    setRunningId(agent.id);
    setExecutionModal({
      title: `⚡ تشغيل فوري للوكيل: ${agent.name}`,
      steps: [{ agentName: agent.name, status: "running" }]
    });
    try {
      const prompt = `أنت وكيل ${agent.name} النشط. قم بتحليل حالة النظام وقدم تقريراً وتوصيات عملية للتحسين الفوري.`;
      const data = await api.post<{ run: { id: string; status: string; output: any; error?: string } }>(
        `/agents/${agent.id}/invoke`,
        { message: prompt }
      );
      const out = data.run?.output || {};
      const isErr = data.run?.status === "failed" || data.run?.error || out.error;
      
      setExecutionModal(prev => prev ? {
        ...prev,
        steps: [{
          agentName: agent.name,
          status: isErr ? "error" : "done",
          logs: out.actionLogs || [],
          result: out.realExecutionResult || null,
          text: out.content || String(out || ""),
          error: data.run?.error || out.error
        }]
      } : null);

      if (isErr) {
        showToast(`❌ فشل التشغيل: ${data.run?.error || out.error || "خطأ غير معروف"}`, false);
      } else {
        showToast(`🚀 تم تشغيل ${agent.name} وإنجاز المهام الحقيقية بنجاح!`, true);
      }
    } catch (err: any) {
      setExecutionModal(prev => prev ? {
        ...prev,
        steps: [{ agentName: agent.name, status: "error", error: err?.message || String(err) }]
      } : null);
      showToast(`❌ خطأ: ${err?.message || String(err)}`, false);
    } finally {
      setRunningId(null);
    }
  };

  // ── Run all active agents ─────────────────────────────────────────────────
  const runAll = async () => {
    const active = agents.filter(a => a.status === "active");
    if (!active.length) { showToast("لا يوجد وكلاء نشطون", false); return; }
    showToast(`🚀 جارٍ تشغيل ${active.length} وكيل بالذكاء الاصطناعي...`, true);
    
    setExecutionModal({
      title: `⚡ تشغيل أسطول وكلاء الذكاء الاصطناعي (${active.length} وكيل نشط)`,
      steps: active.map(a => ({ agentName: a.name, status: "running" }))
    });

    let successCount = 0;
    for (let i = 0; i < active.length; i++) {
      const agent = active[i];
      setRunningId(agent.id);
      try {
        const prompt = `أنت وكيل ${agent.name} النشط. قم بتحليل حالة النظام وقدم تقريراً وتوصيات عملية للتحسين الفوري.`;
        const data = await api.post<{ run: { id: string; status: string; output: any; error?: string } }>(
          `/agents/${agent.id}/invoke`,
          { message: prompt }
        );
        const out = data.run?.output || {};
        const isErr = data.run?.status === "failed" || data.run?.error || out.error;
        if (!isErr) successCount++;

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
    setRunningId(null);
    showToast(`⚡ تم تشغيل وأداء وظائف ${successCount} من أصل ${active.length} وكلاء بنجاح.`, true);
  };

  // ── Save edited instructions ──────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const data = await api.put<{ agent: Agent }>(`/agents/${editModal.id}`, {
        instructions: editInstr,
      });
      setAgents(prev => prev.map(a => a.id === editModal.id ? data.agent : a));
      if (selected?.id === editModal.id) setSelected(data.agent);
      setEditModal(null);
      showToast("✅ تم حفظ التعليمات", true);
    } catch {
      showToast("❌ فشل الحفظ", false);
    } finally {
      setSaving(false);
    }
  };

  // ── View logs ─────────────────────────────────────────────────────────────
  const viewLogs = async (agent: Agent) => {
    setLogsModal(agent);
    setLogsLoading(true);
    try {
      const data = await api.get<{ runs: any[] }>(`/agents/${agent.id}/runs?limit=20`);
      setRuns(data.runs ?? []);
    } catch {
      setRuns([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const activeCount   = agents.filter(a => a.status === "active").length;
  const disabledCount = agents.filter(a => a.status === "disabled").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${toast.ok ? "bg-emerald-900/90 text-emerald-300 border-emerald-700/50" : "bg-red-900/90 text-red-300 border-red-700/50"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white">🤖 AI Agents</h1>
            <p className="text-xs text-purple-500 mt-0.5">
              {loading ? "جارٍ التحميل..." : `${activeCount} نشط · ${disabledCount} موقوف · ${agents.length} إجمالي`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all shadow-lg shadow-emerald-900/30"
            >
              + إضافة وكيل جديد
            </button>
            <button
              onClick={() => void load()}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50 transition-all"
            >
              ↻ تحديث
            </button>
            <button
              onClick={() => void runAll()}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:opacity-90 transition-all"
            >
              🚀 تشغيل الكل
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-purple-600 animate-pulse">جارٍ تحميل الوكلاء من قاعدة البيانات...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(agent => {
              const key = agentKey(agent.name);
              const icon = AGENT_ICONS[key] ?? "🤖";
              const engine = AGENT_ENGINE[key] ?? "AI Engine";
              const isActive = agent.status === "active";
              const isRunning = runningId === agent.id;
              const isExpanded = selected?.id === agent.id;

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelected(isExpanded ? null : agent)}
                  className={`bg-gradient-to-br from-[#130d2a] to-[#0d0920] border rounded-xl p-4 cursor-pointer transition-all ${isActive ? "border-purple-800/50 hover:border-purple-600/60" : "border-gray-800/30 opacity-60"} ${isExpanded ? "ring-1 ring-purple-600/40" : ""}`}
                >
                  {/* Card top */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isActive ? "bg-gradient-to-br from-purple-700 to-indigo-800" : "bg-gray-800"}`}>
                      {isRunning ? "⚡" : icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-black text-white">{agent.name}</p>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" : "bg-gray-600"}`} />
                      </div>
                      <p className="text-[9px] text-purple-600 truncate">{agent.description || "AI Agent"}</p>
                      <p className="text-[9px] text-purple-800 font-mono">{engine}</p>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-mono flex-shrink-0 ${isActive ? "text-emerald-400 border-emerald-800/40 bg-emerald-900/20" : "text-gray-500 border-gray-800/30 bg-gray-900/20"}`}>
                      {isActive ? "active" : "disabled"}
                    </span>
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(agent.capabilities ?? []).slice(0, 3).map(cap => (
                      <span key={cap} className="text-[8px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded font-mono">
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* Expanded area */}
                  {isExpanded && (
                    <div className="border-t border-purple-900/30 pt-3 mt-1" onClick={e => e.stopPropagation()}>
                      <p className="text-[10px] text-purple-400 mb-3 leading-relaxed line-clamp-3">
                        {agent.instructions || agent.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => void runAgent(agent)}
                          disabled={isRunning || !isActive}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-purple-700 to-indigo-700 text-white disabled:opacity-50 transition-all"
                        >
                          {isRunning ? "⏳ يعمل..." : "▶ تشغيل"}
                        </button>
                        <button
                          onClick={() => { setEditModal(agent); setEditInstr(agent.instructions); }}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-blue-900/30 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50"
                        >
                          ✍️ تعديل
                        </button>
                        <button
                          onClick={() => void viewLogs(agent)}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-gray-900/30 text-gray-400 border border-gray-800/30 hover:bg-gray-900/50"
                        >
                          📋 السجلات
                        </button>
                        <button
                          onClick={() => void toggleStatus(agent)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isActive ? "bg-amber-900/30 text-amber-400 border-amber-800/40 hover:bg-amber-900/50" : "bg-emerald-900/30 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50"}`}
                        >
                          {isActive ? "⏸ إيقاف" : "▶ تفعيل"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
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
                onClick={() => void createAgent()}
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

      {/* Edit Instructions Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#130d2a] border border-purple-800/50 rounded-2xl p-5 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{AGENT_ICONS[agentKey(editModal.name)] ?? "🤖"}</span>
              <div>
                <h3 className="text-sm font-black text-white">{editModal.name} — تعديل التعليمات</h3>
                <p className="text-[10px] text-purple-500">سيتم حفظ التعليمات في قاعدة البيانات</p>
              </div>
            </div>
            <textarea
              value={editInstr}
              onChange={e => setEditInstr(e.target.value)}
              rows={8}
              className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 resize-none font-mono"
              placeholder="أدخل تعليمات الوكيل هنا..."
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => void saveEdit()} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">
                {saving ? "⏳ جارٍ الحفظ..." : "💾 حفظ"}
              </button>
              <button onClick={() => setEditModal(null)} className="px-4 py-2 rounded-xl text-sm bg-gray-800/50 text-gray-400 hover:bg-gray-800">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#130d2a] border border-purple-800/50 rounded-2xl p-5 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white">📋 تقارير تشغيل {logsModal.name}</h3>
              <button onClick={() => setLogsModal(null)} className="text-purple-600 hover:text-white text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {logsLoading ? (
                <p className="text-purple-600 text-xs animate-pulse text-center py-8">جارٍ تحميل تقارير التشغيل...</p>
              ) : runs.length === 0 ? (
                <p className="text-purple-700 text-xs text-center py-8">لا توجد تقارير تشغيل مسجلة بعد لهذا الوكيل</p>
              ) : (
                runs.map((run, i) => (
                  <div key={run.id || i} className="bg-[#0d0920] border border-purple-900/30 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-purple-950 pb-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${
                        run.status === "completed" ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" : "bg-red-950/40 border-red-800 text-red-400"
                      }`}>
                        {run.status}
                      </span>
                      <span className="text-[9px] text-purple-700 font-mono">
                        {new Date(run.startedAt || run.completedAt || Date.now()).toLocaleString("ar-SA")}
                      </span>
                    </div>
                    {run.input?.message && (
                      <div>
                        <p className="text-[8px] text-purple-500 font-bold uppercase tracking-wider mb-1">المدخلات / الأمر:</p>
                        <p className="text-[10px] text-purple-300 font-sans leading-relaxed bg-black/20 p-2 rounded border border-purple-950/40 whitespace-pre-wrap">
                          {run.input.message}
                        </p>
                      </div>
                    )}
                    {run.output && (
                      <div>
                        <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider mb-1">المخرجات / التقرير:</p>
                        <p className="text-[10px] text-emerald-300 font-mono leading-relaxed bg-black/40 p-2 rounded border border-emerald-950/40 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {typeof run.output === "object" ? (run.output as any).content || JSON.stringify(run.output, null, 2) : String(run.output)}
                        </p>
                      </div>
                    )}
                    {run.error && (
                      <div className="text-red-400 text-[10px] font-mono bg-red-950/20 border border-red-900/40 p-2 rounded">
                        Error: {run.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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
                    <div className="bg-[#0b071a] rounded-xl p-3 border.border-emerald-700/40 mb-3 text-xs space-y-2">
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
                onClick={() => { setExecutionModal(null); void load(); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50 transition-all font-sans"
              >
                إغلاق وتحديث حالة النظام 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
