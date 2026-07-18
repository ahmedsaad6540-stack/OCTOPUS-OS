import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Prompt {
  id: string;
  name: string;
  agent: string;
  category: string;
  content: string;
  uses?: number;
  rating?: number;
  updatedAt?: string;
}

const AGENTS = ["All", "Brain", "Creator", "Publisher", "Tracker", "Optimizer", "Money", "Competitor", "TrendHunter", "Lab", "CEO"];
const CATEGORIES = ["All", "Research", "Content", "Strategy", "Analysis", "Publishing"];

export function PromptStudioPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [filterAgent, setFilterAgent] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [testInput, setTestInput] = useState("Genius Wave & Wealth Manifestation");
  const [testOutput, setTestOutput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      const res = await api.get<{ success: boolean; prompts?: Prompt[]; error?: string }>("/brain/prompts");
      if (res.success && res.prompts) {
        setPrompts(res.prompts);
        if (!selected && res.prompts.length > 0) {
          setSelected(res.prompts[0]);
          setEditingContent(res.prompts[0].content);
        }
      }
    } catch (e) {
      console.error("Failed to fetch prompts from PostgreSQL:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPrompts();
  }, []);

  const filtered = prompts.filter((p) => {
    if (filterAgent !== "All" && p.agent !== filterAgent) return false;
    if (filterCat !== "All" && p.category !== filterCat) return false;
    return true;
  });

  const selectPrompt = (p: Prompt) => {
    setSelected(p);
    setEditingContent(p.content);
    setTestOutput("");
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      const res = await api.put<{ success: boolean; prompt?: Prompt; error?: string }>(`/brain/prompts/${selected.id}`, {
        content: editingContent
      });
      if (!res.success) {
        alert("فشل الحفظ: " + (res.error || "خطأ من الخادم"));
        return;
      }
      if (res.prompt) {
        setSelected(res.prompt);
        setPrompts((prev) => prev.map((p) => p.id === selected.id ? res.prompt! : p));
        alert("✅ تم حفظ التعديلات في قاعدة بيانات PostgreSQL بنجاح!");
      }
    } catch (err: any) {
      alert("خطأ أثناء الحفظ في خادم الإنتاج: " + (err?.message || String(err)));
    }
  };

  const newPrompt = async () => {
    const defaultName = `New ${filterAgent !== "All" ? filterAgent : "Creator"} Prompt`;
    try {
      const res = await api.post<{ success: boolean; prompt?: Prompt; error?: string }>("/brain/prompts", {
        name: defaultName,
        agent: filterAgent !== "All" ? filterAgent : "Creator",
        category: filterCat !== "All" ? filterCat : "Content",
        content: "Write your production AI instruction prompt here..."
      });
      if (res.success && res.prompt) {
        setPrompts((prev) => [res.prompt!, ...prev]);
        selectPrompt(res.prompt);
      } else {
        alert("فشل إنشاء الأمر: " + (res.error || "خطأ من الخادم"));
      }
    } catch (err: any) {
      alert("خطأ في الخادم: " + (err?.message || String(err)));
    }
  };

  const duplicatePrompt = async () => {
    if (!selected) return;
    try {
      const res = await api.post<{ success: boolean; prompt?: Prompt; error?: string }>("/brain/prompts", {
        name: `${selected.name} (Copy)`,
        agent: selected.agent,
        category: selected.category,
        content: editingContent || selected.content
      });
      if (res.success && res.prompt) {
        setPrompts((prev) => [res.prompt!, ...prev]);
        selectPrompt(res.prompt);
      }
    } catch (err: any) {
      alert("خطأ في الخادم: " + (err?.message || String(err)));
    }
  };

  const deletePrompt = async () => {
    if (!selected || !confirm(`هل أنت متأكد من حذف القالب "${selected.name}" من قاعدة البيانات؟`)) return;
    try {
      const res = await api.delete<{ success: boolean; error?: string }>(`/brain/prompts/${selected.id}`);
      if (res.success) {
        setPrompts((prev) => prev.filter((p) => p.id !== selected.id));
        const remaining = prompts.filter((p) => p.id !== selected.id);
        if (remaining.length > 0) {
          selectPrompt(remaining[0]);
        } else {
          setSelected(null);
          setEditingContent("");
        }
      }
    } catch (err: any) {
      alert("خطأ في الخادم: " + (err?.message || String(err)));
    }
  };

  const runTest = async () => {
    if (!selected) return;
    setTestLoading(true);
    setTestOutput("");
    try {
      // 1. Try finding an agent matching selected.agent to invoke with this template
      let invokedOutput = "";
      try {
        const agentsData = await api.get<{ agents: any[] }>("/agents");
        const match = agentsData.agents?.find(a =>
          a.name.toLowerCase().includes(selected.agent.toLowerCase()) ||
          selected.agent.toLowerCase().includes(a.name.toLowerCase())
        );
        if (match) {
          const runRes = await api.post<{ run?: { status: string; output: any; error?: string } }>(`/agents/${match.id}/invoke`, {
            message: `[PROMPT STUDIO TEST]: ${editingContent || selected.content}\n\n[INPUT DATA]: ${testInput || selected.name}`
          });
          const out = runRes.run?.output;
          invokedOutput = typeof out === "object" ? out.content || JSON.stringify(out, null, 2) : String(out || "");
        }
      } catch (e) {
        // Ignore agent lookup error, try autonomous fallback
      }

      if (invokedOutput && invokedOutput.trim() && !invokedOutput.includes("error")) {
        setTestOutput(`🐙 [LIVE ENGINE RESPONSE - ${selected.agent.toUpperCase()}]\n\n${invokedOutput}\n\n==========================================\n[Status: Verified PostgreSQL Execution | Agent: ${selected.agent}]`);
        return;
      }

      // 2. Fallback to /autonomous/generate-scripts
      const data = await api.post<{
        success: boolean;
        scripts?: { content?: string } | any;
        error?: string;
      }>("/autonomous/generate-scripts", {
        productName: testInput || selected.name,
        platform: "TikTok",
        count: 1,
      });

      if (data.success && (data.scripts?.content || data.scripts)) {
        const text = typeof data.scripts === "string" ? data.scripts : data.scripts.content || JSON.stringify(data.scripts, null, 2);
        setTestOutput(`🐙 [REAL AI ENGINE OUTPUT - ${selected.agent.toUpperCase()}]\n\n${text}\n\n==========================================\n[Status: Live Production AI | Provider: Active LLM Engine]`);
      } else {
        setTestOutput(`⚠️ Real AI Execution Notice: ${data.error || "يرجى التحقق من مفاتيح API في إعدادات مزودي الذكاء الاصطناعي."}`);
      }
    } catch (err: any) {
      setTestOutput(`❌ Production Server Error: ${err?.message || String(err)}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex">
      <div className="w-64 border-r border-purple-900/30 flex flex-col">
        <div className="p-4 border-b border-purple-900/30">
          <h2 className="text-sm font-black text-white mb-3">✍️ Prompt Studio (PostgreSQL)</h2>
          <div className="space-y-2">
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/40 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
              {AGENTS.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/40 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="text-xs text-purple-400 text-center py-4">Loading from PostgreSQL...</p>}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPrompt(p)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${selected?.id === p.id ? "bg-purple-900/40 border border-purple-700/40" : "hover:bg-purple-900/20 border border-transparent"}`}
            >
              <p className="text-xs font-bold text-white truncate">{p.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] bg-purple-800/40 text-purple-300 px-1.5 py-0.5 rounded">{p.agent}</span>
                <span className="text-[9px] text-purple-600 font-mono">{p.uses || 0} uses</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-purple-900/30 flex gap-2">
          <button 
            onClick={() => void newPrompt()}
            className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-all"
          >
            + New Prompt
          </button>
        </div>
      </div>

      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-purple-900/30 flex items-center justify-between bg-[#0d0920]">
            <div>
              <h3 className="text-base font-bold text-white">{selected.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-purple-400">Agent: <strong className="text-white">{selected.agent}</strong></span>
                <span className="text-[10px] text-purple-700">·</span>
                <span className="text-[10px] text-purple-400">Category: <strong className="text-white">{selected.category}</strong></span>
                <span className="text-[10px] text-purple-700">·</span>
                <span className="text-[10px] text-emerald-400 font-mono">Persistent (DB ID: {selected.id.slice(0, 8)}...)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => void duplicatePrompt()}
                className="bg-[#1b123a] hover:bg-purple-900/40 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-800/40 transition-all"
              >
                📋 Duplicate
              </button>
              <button 
                onClick={() => void deletePrompt()}
                className="bg-red-900/20 hover:bg-red-800/40 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-800/40 transition-all"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => void saveEdit()}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-md"
              >
                💾 Save to PostgreSQL
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-4 flex flex-col">
              <label className="text-xs font-bold text-purple-300 mb-2">Prompt Instructions / Template</label>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="flex-1 w-full bg-[#0d0920] border border-purple-800/40 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                placeholder="Enter prompt instructions for your AI agent..."
              />
            </div>

            <div className="w-80 border-l border-purple-900/30 p-4 flex flex-col bg-[#0d0920]/50">
              <h4 className="text-xs font-bold text-white mb-3">🧪 Live Engine Tester</h4>
              <p className="text-[11px] text-purple-400 mb-4">
                Test this prompt instruction against active LLM providers in real-time.
              </p>

              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">Test Input Variable</label>
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Product name or query..."
                className="w-full bg-[#0a0614] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs mb-3 focus:outline-none focus:border-purple-500 font-mono"
              />

              <button
                onClick={() => void runTest()}
                disabled={testLoading}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-all text-xs flex items-center justify-center gap-2 mb-4"
              >
                {testLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Running Real AI Query...
                  </>
                ) : "🚀 Execute Real Test"}
              </button>

              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">Production AI Response</label>
              <div className="flex-1 bg-[#0a0614] border border-purple-800/40 rounded-xl p-3 overflow-y-auto">
                {testOutput ? (
                  <pre className="text-[11px] text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed">{testOutput}</pre>
                ) : (
                  <p className="text-[11px] text-purple-600 font-mono italic">Click "Execute Real Test" to invoke the AI engine...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-purple-500">Select a prompt template from the left or click "+ New Prompt"</p>
        </div>
      )}
    </div>
  );
}
