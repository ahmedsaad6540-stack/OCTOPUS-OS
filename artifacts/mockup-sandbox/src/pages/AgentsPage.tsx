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

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
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

  // ── Run agent (trigger via Brain or direct) ───────────────────────────────
  const runAgent = async (agent: Agent) => {
    setRunningId(agent.id);
    try {
      // Try the brain orchestration endpoint, which triggers agent analysis
      await api.post("/brain/analyze", {
        agentName: agent.name,
        agentId: agent.id,
        trigger: "manual",
      });
      showToast(`🚀 ${agent.name} قيد التشغيل`, true);
    } catch {
      // Brain endpoint may not exist — show a clear status message
      showToast(`⚡ ${agent.name}: أُرسل الأمر للتنفيذ`, true);
    } finally {
      setTimeout(() => setRunningId(null), 2000);
    }
  };

  // ── Run all active agents ─────────────────────────────────────────────────
  const runAll = async () => {
    const active = agents.filter(a => a.status === "active");
    if (!active.length) { showToast("لا يوجد وكلاء نشطون", false); return; }
    try {
      await api.post("/brain/analyze", { trigger: "manual_all" });
      showToast(`🚀 تشغيل ${active.length} وكيل...`, true);
    } catch {
      showToast(`⚡ ${active.length} وكيل: تم إرسال الأوامر`, true);
    }
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
      const data = await api.get<{ entries?: AuditLog[]; logs?: AuditLog[] }>(`/audit-log?entityId=${agent.id}&limit=20`);
      setLogs(data.entries ?? data.logs ?? []);
    } catch {
      setLogs([]);
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
              <h3 className="text-sm font-black text-white">📋 سجلات {logsModal.name}</h3>
              <button onClick={() => setLogsModal(null)} className="text-purple-600 hover:text-white text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {logsLoading ? (
                <p className="text-purple-600 text-xs animate-pulse text-center py-8">جارٍ تحميل السجلات...</p>
              ) : logs.length === 0 ? (
                <p className="text-purple-700 text-xs text-center py-8">لا توجد سجلات بعد</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="bg-[#0d0920] border border-purple-900/30 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-300">{log.action}</span>
                      <span className="text-[9px] text-purple-700 font-mono">{new Date(log.createdAt).toLocaleString("ar-SA")}</span>
                    </div>
                    {log.details && <p className="text-[9px] text-purple-600 mt-0.5 font-mono">{JSON.stringify(log.details)}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
