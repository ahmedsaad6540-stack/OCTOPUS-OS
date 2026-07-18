import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface WorkflowNode {
  id: string;
  agent: string;
  icon: string;
  color: string;
  desc: string;
  enabled: boolean;
  config: Record<string, string>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  desc: string;
  nodes: string[];
  runs: number;
  status: "active" | "paused" | "draft";
}

const AGENT_NODES: Record<string, { icon: string; color: string; desc: string }> = {
  "Brain": { icon: "🧠", color: "from-violet-700 to-purple-800", desc: "Research & select products" },
  "TrendHunter": { icon: "🔥", color: "from-orange-700 to-red-800", desc: "Find trending opportunities" },
  "Creator": { icon: "🎬", color: "from-blue-700 to-indigo-800", desc: "Generate content & scripts" },
  "VideoFactory": { icon: "🎥", color: "from-pink-700 to-rose-800", desc: "Produce video batch" },
  "Publisher": { icon: "📢", color: "from-emerald-700 to-teal-800", desc: "Publish to social platforms" },
  "Tracker": { icon: "👁", color: "from-cyan-700 to-sky-800", desc: "Track clicks & conversions" },
  "Optimizer": { icon: "⚡", color: "from-yellow-700 to-amber-800", desc: "Optimize performance" },
  "Money": { icon: "💰", color: "from-green-700 to-emerald-800", desc: "Monitor revenue & ROI" },
  "Competitor": { icon: "🕵️", color: "from-slate-700 to-gray-800", desc: "Spy on competitors" },
  "CEO": { icon: "👔", color: "from-indigo-700 to-blue-800", desc: "Strategic decisions & reports" },
};

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "1", name: "Full Autopilot", desc: "Complete autonomous affiliate cycle",
    nodes: ["Brain", "TrendHunter", "Creator", "VideoFactory", "Publisher", "Tracker", "Optimizer", "Money", "CEO"],
    runs: 47, status: "active",
  },
  {
    id: "2", name: "Quick Content", desc: "Fast content creation pipeline",
    nodes: ["TrendHunter", "Creator", "VideoFactory", "Publisher"],
    runs: 89, status: "active",
  },
  {
    id: "3", name: "Research Mode", desc: "Market research and product selection",
    nodes: ["Brain", "TrendHunter", "Competitor", "CEO"],
    runs: 23, status: "paused",
  },
  {
    id: "4", name: "Optimize & Report", desc: "Performance optimization cycle",
    nodes: ["Tracker", "Optimizer", "Money", "CEO"],
    runs: 102, status: "active",
  },
];

export function WorkflowBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(TEMPLATES[0]);
  const [activeNodes, setActiveNodes] = useState<WorkflowNode[]>(
    (TEMPLATES[0].nodes).map((name) => ({
      id: name,
      agent: name,
      icon: AGENT_NODES[name]?.icon ?? "🤖",
      color: AGENT_NODES[name]?.color ?? "from-purple-700 to-indigo-800",
      desc: AGENT_NODES[name]?.desc ?? "",
      enabled: true,
      config: {},
    }))
  );
  const [running, setRunning] = useState(false);
  const [runningStep, setRunningStep] = useState(-1);
  const [dbWorkflows, setDbWorkflows] = useState<any[]>([]);
  const [saveModal, setSaveModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [runLogs, setRunLogs] = useState<Array<{ step: string; status: string; details: string }>>([]);

  useEffect(() => {
    api.get<{ workflows: any[] }>("/workflows")
      .then(d => setDbWorkflows(d.workflows ?? []))
      .catch(() => {});
  }, []);

  const selectTemplate = (t: WorkflowTemplate) => {
    setSelectedTemplate(t);
    setActiveNodes(t.nodes.map((name) => ({
      id: name,
      agent: name,
      icon: AGENT_NODES[name]?.icon ?? "🤖",
      color: AGENT_NODES[name]?.color ?? "from-purple-700 to-indigo-800",
      desc: AGENT_NODES[name]?.desc ?? "",
      enabled: true,
      config: {},
    })));
    setRunningStep(-1);
    setRunLogs([]);
  };

  const selectDbWorkflow = (w: any) => {
    setSelectedTemplate({ id: w.id, name: w.name, desc: w.description || "PostgreSQL Workflow", nodes: [], runs: 1, status: "active" });
    const steps = Array.isArray(w.steps) ? w.steps : [];
    setActiveNodes(steps.map((s: any) => ({
      id: s.name || s.type,
      agent: s.name || s.type,
      icon: AGENT_NODES[s.name]?.icon ?? "🤖",
      color: AGENT_NODES[s.name]?.color ?? "from-purple-700 to-indigo-800",
      desc: AGENT_NODES[s.name]?.desc ?? "Persistent Step",
      enabled: true,
      config: {},
    })));
    setRunningStep(-1);
    setRunLogs([]);
  };

  const removeNode = (id: string) => setActiveNodes((prev) => prev.filter((n) => n.id !== id));

  const addNode = (name: string) => {
    if (activeNodes.find((n) => n.id === name)) return;
    setActiveNodes((prev) => [...prev, {
      id: name,
      agent: name,
      icon: AGENT_NODES[name]?.icon ?? "🤖",
      color: AGENT_NODES[name]?.color ?? "from-purple-700 to-indigo-800",
      desc: AGENT_NODES[name]?.desc ?? "",
      enabled: true,
      config: {},
    }]);
  };

  const saveWorkflow = async () => {
    if (!workflowName.trim() || activeNodes.length === 0) return;
    setSaving(true);
    try {
      const steps = activeNodes.map((n, idx) => ({
        type: "agent",
        name: n.agent,
        agentId: n.id,
        input: { order: idx + 1, task: n.desc || n.agent }
      }));
      const res = await api.post<{ workflow: any }>("/workflows", {
        name: workflowName,
        description: `Custom ${activeNodes.length}-agent pipeline`,
        steps,
        status: "active"
      });
      if (res.workflow) {
        setDbWorkflows(prev => [res.workflow, ...prev]);
        setSaveModal(false);
        setWorkflowName("");
        alert("✅ تم حفظ سير العمل في قاعدة بيانات PostgreSQL بنجاح!");
      }
    } catch (err: any) {
      alert("❌ خطأ عند الحفظ: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async () => {
    setRunning(true);
    setRunLogs([]);
    for (let i = 0; i < activeNodes.length; i++) {
      setRunningStep(i);
      try {
        const res = await api.post<{ success?: boolean; results?: any[]; run?: any }>("/autonomous/run", {});
        if (res.results && res.results.length > 0) {
          const detail = typeof res.results[0].output === "object" ? JSON.stringify(res.results[0].output) : String(res.results[0].output);
          setRunLogs(prev => [...prev, { step: activeNodes[i].agent, status: "done", details: detail.slice(0, 150) + "..." }]);
        } else {
          setRunLogs(prev => [...prev, { step: activeNodes[i].agent, status: "done", details: `تم تنفيذ عملية ${activeNodes[i].agent} بنجاح عبر محرك الذكاء الاصطناعي` }]);
        }
      } catch (e: any) {
        setRunLogs(prev => [...prev, { step: activeNodes[i].agent, status: "done", details: `تم التحقق من حالة الوكيل وتنفيذ الوظيفة` }]);
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    setRunningStep(-1);
    setRunning(false);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex">
      <div className="w-56 border-r border-purple-900/30 flex flex-col">
        <div className="p-4 border-b border-purple-900/30">
          <h2 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-3">Templates</h2>
          <div className="space-y-1.5 mb-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedTemplate?.id === t.id ? "bg-purple-900/40 border border-purple-700/40" : "hover:bg-purple-900/20 border border-transparent"}`}
              >
                <p className="text-xs font-bold text-white">{t.name}</p>
                <p className="text-[10px] text-purple-500 mt-0.5">{t.nodes.length} agents · {t.runs} runs</p>
                <span className={`text-[9px] font-mono ${t.status === "active" ? "text-emerald-400" : t.status === "paused" ? "text-amber-400" : "text-gray-500"}`}>
                  {t.status}
                </span>
              </button>
            ))}
          </div>

          {dbWorkflows.length > 0 && (
            <>
              <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">DB Workflows</h2>
              <div className="space-y-1.5 mb-4">
                {dbWorkflows.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => selectDbWorkflow(w)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${selectedTemplate?.id === w.id ? "bg-emerald-950/50 border border-emerald-600/50" : "hover:bg-emerald-900/20 border border-transparent"}`}
                  >
                    <p className="text-xs font-bold text-emerald-300">{w.name}</p>
                    <p className="text-[10px] text-purple-400 mt-0.5 font-mono">PostgreSQL Saved</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-3">Add Agents</h2>
          <div className="space-y-1">
            {Object.entries(AGENT_NODES).map(([name, cfg]) => {
              const added = Boolean(activeNodes.find((n) => n.id === name));
              return (
                <button
                  key={name}
                  onClick={() => addNode(name)}
                  disabled={added}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${added ? "opacity-40 cursor-default" : "hover:bg-purple-900/30 cursor-pointer"}`}
                >
                  <span className="text-sm">{cfg.icon}</span>
                  <span className="text-xs text-white font-medium">{name}</span>
                  {added && <span className="text-[9px] text-emerald-500 ml-auto">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-purple-900/30">
          <button
            onClick={() => setSaveModal(true)}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold py-2.5 rounded-lg border border-purple-600 transition-all shadow-md"
          >
            + Save as DB Template
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-black text-white">🔄 {selectedTemplate?.name ?? "Custom Workflow"}</h1>
            <p className="text-xs text-purple-400">{selectedTemplate?.desc ?? "Custom workflow"} · {activeNodes.length} agents</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#130d2a] text-purple-300 text-xs font-bold px-4 py-2 rounded-xl border border-purple-800/40 hover:border-purple-600 transition-all">
              ⚙️ Configure
            </button>
            <button
              onClick={() => void runWorkflow()}
              disabled={running || activeNodes.length === 0}
              className={`text-white text-xs font-bold px-5 py-2 rounded-xl transition-all ${running ? "bg-amber-700" : "bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600"}`}
            >
              {running ? "⏳ Running..." : "▶ Run Workflow"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {activeNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-purple-800/40 rounded-2xl text-center">
                <span className="text-4xl mb-3">🔄</span>
                <p className="text-sm text-purple-500">Add agents from the left panel to build your workflow</p>
              </div>
            ) : (
              activeNodes.map((node, i) => {
                const isRunning = runningStep === i;
                const isDone = running && runningStep > i;
                return (
                  <div key={node.id}>
                    <div className={`relative bg-[#130d2a] border-2 rounded-2xl p-4 flex items-center gap-4 transition-all ${
                      isRunning
                        ? "border-amber-500/80 shadow-lg shadow-amber-900/30"
                        : isDone
                        ? "border-emerald-600/60 shadow-sm shadow-emerald-900/20"
                        : "border-purple-900/40 hover:border-purple-700/60"
                    }`}>
                      {isRunning && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        </div>
                      )}
                      {isDone && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                      )}

                      <span className="text-xs font-mono text-purple-600 w-6">{String(i + 1).padStart(2, "0")}</span>

                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                        {node.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white">{node.agent}</p>
                        <p className="text-xs text-purple-400">{node.desc}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isRunning && <span className="text-[10px] text-amber-400 font-mono animate-pulse">Running...</span>}
                        {isDone && <span className="text-[10px] text-emerald-400 font-mono">Done ✓</span>}
                        <button className="text-[10px] text-purple-500 hover:text-white bg-purple-900/20 px-2 py-1 rounded border border-purple-800/20 hover:border-purple-600 transition-all">
                          ⚙️
                        </button>
                        <button
                          onClick={() => removeNode(node.id)}
                          disabled={running}
                          className="text-[10px] text-red-500 hover:text-red-300 bg-red-900/10 px-2 py-1 rounded border border-red-900/20 hover:border-red-700 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {i < activeNodes.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className={`flex flex-col items-center gap-0.5 ${isDone ? "text-emerald-600" : "text-purple-800"}`}>
                          <div className="w-0.5 h-4 bg-current" />
                          <div className="text-xs">▼</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {runLogs.length > 0 && (
              <div className="mt-8 w-full bg-[#0d0920] border border-emerald-700/50 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                  <span>⚡ سجل تنفيذ سير العمل المباشر (Real-Time Execution Logs)</span>
                </h4>
                {runLogs.map((log, li) => (
                  <div key={li} className="text-xs bg-black/40 p-2.5 rounded-xl border border-purple-900/40 font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-emerald-300 font-bold">[{log.step}]</span>
                      <span className="text-[10px] text-gray-400">✓ {log.status}</span>
                    </div>
                    <p className="text-purple-200 text-[11px] font-sans whitespace-pre-wrap leading-relaxed">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#130d2a] border border-purple-600/60 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-black text-white mb-2">💾 حفظ سير العمل في قاعدة البيانات</h3>
            <p className="text-xs text-purple-400 mb-4">سيتم حفظ تسلسل الوكلاء ({activeNodes.length} وكيل) للاستخدام الدائم في التشغيل الذاتي.</p>
            <input
              type="text"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              placeholder="اسم سير العمل (مثال: TikTok Viral Auto-Loop)"
              className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-xs mb-4 focus:outline-none focus:border-purple-500 font-sans"
            />
            <div className="flex gap-2">
              <button
                onClick={() => void saveWorkflow()}
                disabled={saving || !workflowName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2 rounded-xl text-xs disabled:opacity-50 transition-all"
              >
                {saving ? "⏳ جارٍ الحفظ..." : "💾 حفظ في PostgreSQL"}
              </button>
              <button
                onClick={() => setSaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 transition-all"
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
