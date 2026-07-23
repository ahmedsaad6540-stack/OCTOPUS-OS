import { useState } from "react";

const PLATFORMS = [
  { id: "railway", icon: "🚂", name: "Railway", desc: "One-click deploy" },
  { id: "render",  icon: "🎨", name: "Render",  desc: "Auto-scaling cloud" },
  { id: "fly",     icon: "🪰", name: "Fly.io",  desc: "Edge computing" },
  { id: "aws",     icon: "🟠", name: "AWS",     desc: "Enterprise-grade" },
  { id: "gcp",     icon: "🌐", name: "GCP",     desc: "Google cloud" },
  { id: "do",      icon: "🌊", name: "DigitalOcean", desc: "Simple cloud" },
  { id: "docker",  icon: "🐳", name: "Docker",  desc: "Self-hosted" },
  { id: "vps",     icon: "🖥️", name: "Custom VPS", desc: "Any provider" },
];

export function DeploymentPage() {
  const [selected, setSelected] = useState("railway");
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [deployed, setDeployed] = useState(false);

  const deploy = async () => {
    setDeploying(true); setLogs([]); setDeployed(false);
    const platform = PLATFORMS.find(p => p.id === selected)?.name || selected;
    const steps = [
      "🔍 Validating configuration...",
      "📦 Building Docker image...",
      "⬆️ Pushing to registry...",
      `🚀 Deploying to ${platform}...`,
      "🔒 Configuring SSL/TLS...",
      "🔄 Running health checks...",
      "✅ Deployment successful!",
      "🌐 App live at https://octopus-nexus.yourdomain.com",
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setLogs(l => [...l, `[${new Date().toLocaleTimeString()}] ${step}`]);
    }
    setDeploying(false); setDeployed(true);
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🚀 Deployment</h1>
        <p className="text-purple-400/60 text-xs mt-1">Deploy OCTOPUS NEXUS OS to any cloud provider</p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="card-os p-4 mb-4">
            <h3 className="text-xs font-bold text-purple-300 mb-3">Select Platform</h3>
            <div className="space-y-1.5">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setSelected(p.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all text-left ${selected === p.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}
                  style={selected !== p.id ? { border: "1px solid rgba(139,92,246,0.1)" } : {}}>
                  <span className="text-base">{p.icon}</span>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[10px] opacity-70">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={deploy} disabled={deploying}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-purple glow-purple disabled:opacity-60">
            {deploying ? "⟳ Deploying..." : `🚀 Deploy Now`}
          </button>
        </div>
        <div className="col-span-2">
          <div className="card-os p-4 mb-4">
            <h3 className="text-xs font-bold text-purple-300 mb-3">Environment Variables</h3>
            <div className="space-y-2">
              {[["DATABASE_URL","postgresql://..."],["JWT_SECRET","auto-generated"],["OPENAI_API_KEY","sk-..."],["NODE_ENV","production"]].map(([k,v]) => (
                <div key={k} className="flex gap-2">
                  <input defaultValue={k} className="w-36 px-2 py-1.5 rounded-lg text-xs font-mono text-purple-300 outline-none" style={{ background:"#0a0614", border:"1px solid rgba(139,92,246,0.15)" }} />
                  <input defaultValue={v} type="password" className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono text-purple-400/60 outline-none" style={{ background:"#0a0614", border:"1px solid rgba(139,92,246,0.15)" }} />
                </div>
              ))}
            </div>
          </div>
          <div className="card-os p-4">
            <h3 className="text-xs font-bold text-purple-300 mb-3">📋 Deploy Log</h3>
            <div className="font-mono text-xs min-h-48 max-h-64 overflow-y-auto p-3 rounded-lg" style={{ background:"#050310" }}>
              {logs.length === 0 && !deploying && <div className="text-purple-500/40">Waiting for deployment to start...</div>}
              {logs.map((l, i) => (
                <div key={i} className={`mb-1 ${l.includes("✅")||l.includes("🌐") ? "text-emerald-400" : "text-purple-300/80"}`}>{l}</div>
              ))}
              {deploying && <div className="text-purple-400 animate-pulse">▌</div>}
            </div>
            {deployed && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-400">✅ Deployment Successful — App is live</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
