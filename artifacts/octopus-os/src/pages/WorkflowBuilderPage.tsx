import { useState } from "react";

const DEFAULT_NODES = [
  { id: 1, name: "TrendHunter", icon: "📈", status: "completed", x: 0 },
  { id: 2, name: "Brain Agent", icon: "🧠", status: "completed", x: 1 },
  { id: 3, name: "Creator Agent", icon: "✍️", status: "running", x: 2 },
  { id: 4, name: "Video Factory", icon: "🎬", status: "waiting", x: 3 },
  { id: 5, name: "Publisher", icon: "📢", status: "waiting", x: 4 },
  { id: 6, name: "Tracker", icon: "📊", status: "waiting", x: 5 },
  { id: 7, name: "Optimizer", icon: "⚡", status: "waiting", x: 6 },
  { id: 8, name: "Money Agent", icon: "💰", status: "waiting", x: 7 },
  { id: 9, name: "CEO Agent", icon: "👔", status: "waiting", x: 8 },
];

const AVAILABLE = [
  { name: "TrendHunter", icon: "📈" }, { name: "Competitor", icon: "🕵️" },
  { name: "Brain Agent", icon: "🧠" }, { name: "Creator", icon: "✍️" },
  { name: "Video Factory", icon: "🎬" }, { name: "Publisher", icon: "📢" },
  { name: "Tracker", icon: "📊" }, { name: "Optimizer", icon: "⚡" },
  { name: "Money", icon: "💰" }, { name: "CEO", icon: "👔" },
  { name: "Voice", icon: "🎤" }, { name: "Custom", icon: "⚙️" },
];

export function WorkflowBuilderPage() {
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);

  const runWorkflow = async () => {
    setRunning(true);
    setNodes(ns => ns.map((n, i) => ({ ...n, status: i === 0 ? "running" : "waiting" })));
    setCurrentStep(0);
    for (let i = 0; i < nodes.length; i++) {
      setCurrentStep(i);
      setNodes(ns => ns.map((n, idx) => ({ ...n, status: idx < i ? "completed" : idx === i ? "running" : "waiting" })));
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    }
    setNodes(ns => ns.map(n => ({ ...n, status: "completed" })));
    setCurrentStep(nodes.length);
    setRunning(false);
  };

  const removeNode = (id: number) => {
    setNodes(ns => ns.filter(n => n.id !== id).map((n, i) => ({ ...n, x: i })));
  };

  const addNode = (name: string, icon: string) => {
    setNodes(ns => [...ns, { id: Date.now(), name, icon, status: "waiting", x: ns.length }]);
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🔄 Workflow Builder</h1>
          <p className="text-purple-400/60 text-xs mt-1">Build automated agent pipelines — drag, drop, run</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runWorkflow} disabled={running}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-purple glow-purple disabled:opacity-60">
            {running ? `⟳ Running Step ${currentStep + 1}/${nodes.length}...` : "▶ Run Workflow"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Canvas */}
        <div className="col-span-3 card-os p-6">
          <div className="text-xs text-purple-400/60 mb-4">🔄 Autonomous Workflow — {nodes.length} steps</div>

          <div className="flex flex-wrap gap-0 items-center">
            {nodes.map((node, i) => (
              <div key={node.id} className="flex items-center">
                <div className={`relative flex flex-col items-center p-4 rounded-xl transition-all border ${
                  node.status === "completed" ? "border-emerald-500/40 bg-emerald-900/10" :
                  node.status === "running" ? "border-purple-500/60 bg-purple-900/20" :
                  "border-purple-500/15 bg-purple-900/5"
                }`} style={{ minWidth: 90 }}>
                  {node.status === "running" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
                  )}
                  <button onClick={() => removeNode(node.id)}
                    className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-900/80 text-red-400 text-[8px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    style={{ fontSize: 8 }}>✕</button>
                  <span className="text-2xl mb-1">{node.icon}</span>
                  <span className="text-[10px] font-medium text-center text-white">{node.name}</span>
                  <span className={`text-[9px] mt-1 ${
                    node.status === "completed" ? "text-emerald-400" :
                    node.status === "running" ? "text-purple-300" : "text-gray-600"
                  }`}>{node.status === "completed" ? "✓ Done" : node.status === "running" ? "⟳ Running" : "Waiting"}</span>
                </div>
                {i < nodes.length - 1 && (
                  <div className={`h-px w-8 mx-1 transition-all ${node.status === "completed" ? "bg-emerald-500/60" : "bg-purple-500/20"}`}></div>
                )}
              </div>
            ))}
          </div>

          {running && (
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-xs text-purple-300">
                  Executing: <strong>{nodes[currentStep]?.name || "Complete"}</strong>
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                <div className="h-full rounded-full gradient-purple transition-all duration-500"
                  style={{ width: `${(currentStep / nodes.length) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Agent Library */}
        <div className="card-os p-4">
          <h3 className="text-xs font-bold text-purple-300 mb-3">Agent Library</h3>
          <p className="text-[10px] text-purple-400/60 mb-3">Click to add to workflow</p>
          <div className="space-y-1.5">
            {AVAILABLE.map(a => (
              <button key={a.name} onClick={() => addNode(a.name, a.icon)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-purple-300 hover:bg-purple-900/30 transition-all text-left">
                <span>{a.icon}</span>
                <span>{a.name}</span>
                <span className="ml-auto text-purple-500/40">+</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
