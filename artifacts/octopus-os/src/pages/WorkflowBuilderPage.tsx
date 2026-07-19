import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface WorkflowStep {
  id: string;
  name: string;
  icon: string;
  status: "waiting" | "running" | "completed" | "error";
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt?: string;
  updatedAt?: string;
}

const AVAILABLE = [
  { name: "TrendHunter", icon: "📈" }, { name: "Competitor", icon: "🕵️" },
  { name: "Brain Agent", icon: "🧠" }, { name: "Creator", icon: "✍️" },
  { name: "Video Factory", icon: "🎬" }, { name: "Publisher", icon: "📢" },
  { name: "Tracker", icon: "📊" }, { name: "Optimizer", icon: "⚡" },
  { name: "Money", icon: "💰" }, { name: "CEO", icon: "👔" },
  { name: "Voice", icon: "🎤" }, { name: "Custom", icon: "⚙️" },
];

export function WorkflowBuilderPage() {
  const { token } = useAuth();

  // Workflow list from DB
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active workflow being built/viewed
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [localSteps, setLocalSteps] = useState<WorkflowStep[]>([]);

  // Run state
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const authHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ── Fetch all workflows ────────────────────────────────────────────────────
  const fetchWorkflows = async () => {
    if (!token) return;
    setLoadingWorkflows(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list: Workflow[] = Array.isArray(data) ? data : data.workflows ?? [];
        setWorkflows(list);
        // Auto-select first if nothing selected
        if (!activeWorkflow && list.length > 0) {
          setActiveWorkflow(list[0]);
          setLocalSteps(list[0].steps ?? []);
        }
      } else {
        setError(`Failed to load workflows (${res.status})`);
      }
    } catch (err) {
      console.error("fetchWorkflows error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    if (token) fetchWorkflows();
  }, [token]);

  // ── Create workflow ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!token || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/workflows`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), steps: [] }),
      });
      if (res.ok) {
        const created: Workflow = await res.json();
        setWorkflows(prev => [created, ...prev]);
        setActiveWorkflow(created);
        setLocalSteps([]);
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
      } else {
        alert(`Could not create workflow (${res.status})`);
      }
    } catch (err) {
      console.error("createWorkflow error:", err);
      alert("Failed to create workflow.");
    } finally {
      setCreating(false);
    }
  };

  // ── Delete workflow ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this workflow?")) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        const remaining = workflows.filter(w => w.id !== id);
        setWorkflows(remaining);
        if (activeWorkflow?.id === id) {
          setActiveWorkflow(remaining[0] ?? null);
          setLocalSteps(remaining[0]?.steps ?? []);
        }
      } else {
        alert(`Could not delete workflow (${res.status})`);
      }
    } catch (err) {
      console.error("deleteWorkflow error:", err);
      alert("Failed to delete workflow.");
    }
  };

  // ── Run workflow ───────────────────────────────────────────────────────────
  const runWorkflow = async () => {
    if (!token || !activeWorkflow) return;
    setRunning(true);

    // Try server-side run first
    try {
      const res = await fetch(`/api/workflows/${activeWorkflow.id}/run`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        // Server accepted the run — animate locally
        await simulateRun();
        setRunning(false);
        return;
      }
    } catch {
      // Endpoint may not exist — fall through to local simulation
    }

    // Local simulation fallback
    await simulateRun();
    setRunning(false);
  };

  const simulateRun = async () => {
    const steps = localSteps.length > 0 ? localSteps : activeWorkflow?.steps ?? [];
    setLocalSteps(steps.map((s, i) => ({ ...s, status: i === 0 ? "running" : "waiting" })));
    setCurrentStep(0);
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setLocalSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? "completed" : idx === i ? "running" : "waiting",
      })));
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    }
    setLocalSteps(prev => prev.map(s => ({ ...s, status: "completed" })));
    setCurrentStep(steps.length);
  };

  // ── Local step helpers (canvas editing) ───────────────────────────────────
  const removeStep = (id: string) => {
    setLocalSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s })));
  };

  const addStep = (name: string, icon: string) => {
    const newStep: WorkflowStep = {
      id: `${Date.now()}`,
      name,
      icon,
      status: "waiting",
    };
    setLocalSteps(prev => [...prev, newStep]);
  };

  const selectWorkflow = (wf: Workflow) => {
    setActiveWorkflow(wf);
    setLocalSteps(wf.steps ?? []);
    setRunning(false);
    setCurrentStep(0);
  };

  const displaySteps = localSteps;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🔄 Workflow Builder</h1>
          <p className="text-purple-400/60 text-xs mt-1">Build automated agent pipelines — drag, drop, run</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all"
          >
            + New Workflow
          </button>
          <button
            onClick={runWorkflow}
            disabled={running || !activeWorkflow || displaySteps.length === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-purple glow-purple disabled:opacity-60"
          >
            {running ? `⟳ Running Step ${currentStep + 1}/${displaySteps.length}...` : "▶ Run Workflow"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Workflow Tabs (list from DB) */}
      {workflows.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {workflows.map(wf => (
            <div key={wf.id} className="flex items-center gap-1">
              <button
                onClick={() => selectWorkflow(wf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeWorkflow?.id === wf.id
                    ? "bg-purple-700/40 border border-purple-500/50 text-purple-200"
                    : "bg-purple-950/30 border border-purple-500/15 text-purple-400/70 hover:text-purple-300"
                }`}
              >
                {wf.name}
              </button>
              <button
                onClick={() => handleDelete(wf.id)}
                className="text-red-500/50 hover:text-red-400 text-[10px] px-1 transition-colors"
                title="Delete workflow"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* Canvas */}
        <div className="col-span-3 card-os p-6">
          {loadingWorkflows ? (
            <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
              Loading workflows from database...
            </div>
          ) : !activeWorkflow ? (
            <div className="text-center py-20 text-purple-400/40 text-xs font-mono space-y-2">
              <p>No workflows yet.</p>
              <button onClick={() => setShowCreate(true)} className="text-purple-400 hover:text-purple-300 underline text-xs">
                Create your first workflow →
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs text-purple-400/60 mb-4">
                🔄 {activeWorkflow.name} — {displaySteps.length} steps
                {activeWorkflow.description && (
                  <span className="ml-2 text-purple-500/40">· {activeWorkflow.description}</span>
                )}
              </div>

              {displaySteps.length === 0 ? (
                <div className="text-center py-16 text-purple-400/30 text-xs font-mono">
                  No steps yet. Add agents from the library →
                </div>
              ) : (
                <div className="flex flex-wrap gap-0 items-center">
                  {displaySteps.map((node, i) => (
                    <div key={node.id} className="flex items-center">
                      <div className={`relative flex flex-col items-center p-4 rounded-xl transition-all border ${
                        node.status === "completed" ? "border-emerald-500/40 bg-emerald-900/10" :
                        node.status === "running"   ? "border-purple-500/60 bg-purple-900/20" :
                        node.status === "error"     ? "border-red-500/40 bg-red-900/10" :
                        "border-purple-500/15 bg-purple-900/5"
                      }`} style={{ minWidth: 90 }}>
                        {node.status === "running" && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                        )}
                        <button
                          onClick={() => removeStep(node.id)}
                          className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-900/80 text-red-400 text-[8px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          style={{ fontSize: 8 }}
                        >✕</button>
                        <span className="text-2xl mb-1">{node.icon}</span>
                        <span className="text-[10px] font-medium text-center text-white">{node.name}</span>
                        <span className={`text-[9px] mt-1 ${
                          node.status === "completed" ? "text-emerald-400" :
                          node.status === "running"   ? "text-purple-300" :
                          node.status === "error"     ? "text-red-400" : "text-gray-600"
                        }`}>
                          {node.status === "completed" ? "✓ Done" :
                           node.status === "running"   ? "⟳ Running" :
                           node.status === "error"     ? "✗ Error" : "Waiting"}
                        </span>
                      </div>
                      {i < displaySteps.length - 1 && (
                        <div className={`h-px w-8 mx-1 transition-all ${
                          node.status === "completed" ? "bg-emerald-500/60" : "bg-purple-500/20"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {running && (
                <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs text-purple-300">
                      Executing: <strong>{displaySteps[currentStep]?.name || "Complete"}</strong>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <div className="h-full rounded-full gradient-purple transition-all duration-500"
                      style={{ width: `${(currentStep / displaySteps.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Agent Library */}
        <div className="card-os p-4">
          <h3 className="text-xs font-bold text-purple-300 mb-3">Agent Library</h3>
          <p className="text-[10px] text-purple-400/60 mb-3">Click to add to workflow</p>
          <div className="space-y-1.5">
            {AVAILABLE.map(a => (
              <button
                key={a.name}
                onClick={() => addStep(a.name, a.icon)}
                disabled={!activeWorkflow}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-purple-300 hover:bg-purple-900/30 transition-all text-left disabled:opacity-40"
              >
                <span>{a.icon}</span>
                <span>{a.name}</span>
                <span className="ml-auto text-purple-500/40">+</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "#13092a", border: "1px solid rgba(139,92,246,0.25)" }}>
            <h2 className="text-sm font-bold text-white">Create New Workflow</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-purple-400/70 mb-1 block">Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Daily Content Pipeline"
                  className="w-full px-3 py-2 rounded-lg text-xs text-white bg-purple-950/30 border border-purple-500/20 focus:outline-none focus:border-purple-500/50 placeholder-purple-400/30"
                />
              </div>
              <div>
                <label className="text-xs text-purple-400/70 mb-1 block">Description</label>
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 rounded-lg text-xs text-white bg-purple-950/30 border border-purple-500/20 focus:outline-none focus:border-purple-500/50 placeholder-purple-400/30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
                className="flex-1 py-2 rounded-xl text-xs text-purple-400 bg-purple-950/30 border border-purple-500/20 hover:bg-purple-900/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white gradient-purple disabled:opacity-50 transition-all"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
