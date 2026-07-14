import { useState } from "react";

const PROVIDERS = [
  { id: "render", name: "Render", icon: "🟣", desc: "Simple cloud hosting with auto-deploy", free: true, recommended: true },
  { id: "railway", name: "Railway", icon: "🚂", desc: "Developer-friendly platform with one-click deploy", free: true },
  { id: "fly", name: "Fly.io", icon: "🪰", desc: "Edge deployments globally with Docker", free: true },
  { id: "vercel", name: "Vercel", icon: "▲", desc: "Frontend + serverless functions", free: true },
  { id: "aws", name: "AWS", icon: "☁️", desc: "Amazon Web Services full infrastructure", free: false },
  { id: "azure", name: "Azure", icon: "🔷", desc: "Microsoft Azure cloud platform", free: false },
  { id: "gcp", name: "Google Cloud", icon: "🌈", desc: "Google Cloud Platform services", free: false },
  { id: "digitalocean", name: "DigitalOcean", icon: "💧", desc: "Simple VPS droplets and managed services", free: false },
  { id: "docker", name: "Docker / VPS", icon: "🐳", desc: "Self-hosted on any VPS with Docker", free: false },
];

export function DeploymentPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [deployed, setDeployed] = useState<Record<string, boolean>>({});

  const deploy = async (id: string) => {
    setDeploying(true);
    setDeployStep(0);
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setDeployStep(i);
    }
    setDeployed((prev) => ({ ...prev, [id]: true }));
    setDeploying(false);
  };

  const STEPS = ["Preparing build", "Installing dependencies", "Running tests", "Building Docker image", "Deploying to cloud"];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">🚀 Deployment</h1>
          <p className="text-purple-400 text-sm mt-1">Deploy OCTOPUS OS to the cloud with one click</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Select Deployment Target</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelected(provider.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                    selected === provider.id
                      ? "border-purple-600/70 bg-purple-900/20 shadow-lg shadow-purple-900/20"
                      : "border-purple-900/40 bg-[#130d2a] hover:border-purple-700/60"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0d0920] border border-purple-900/30 flex items-center justify-center text-xl flex-shrink-0">
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-white">{provider.name}</p>
                      {provider.recommended && <span className="text-[9px] bg-emerald-900/40 text-emerald-300 border border-emerald-800/30 px-1.5 py-0.5 rounded-full">Recommended</span>}
                      {provider.free && <span className="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-800/30 px-1.5 py-0.5 rounded-full">Free tier</span>}
                    </div>
                    <p className="text-[10px] text-purple-400">{provider.desc}</p>
                    {deployed[provider.id] && <p className="text-[10px] text-emerald-400 mt-1 font-bold">✓ Deployed</p>}
                  </div>
                  {selected === provider.id && (
                    <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">⚙️ Build Configuration</h3>
              <div className="space-y-2">
                {[
                  { label: "Node Version", value: "24.x" },
                  { label: "Build Command", value: "pnpm run build" },
                  { label: "Start Command", value: "pnpm run start" },
                  { label: "Port", value: "8080" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-purple-900/20 last:border-0">
                    <span className="text-[10px] text-purple-500">{label}</span>
                    <span className="text-[10px] font-mono text-white bg-[#0d0920] px-2 py-0.5 rounded">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">🌍 Environment</h3>
              <div className="space-y-2">
                {["DATABASE_URL", "JWT_SECRET", "NODE_ENV"].map((key) => (
                  <div key={key} className="flex items-center justify-between bg-[#0d0920] rounded-lg px-2 py-1.5 border border-purple-900/20">
                    <span className="text-[10px] font-mono text-purple-300">{key}</span>
                    <span className="text-[10px] text-purple-600">••••••••</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-xs text-purple-400 bg-purple-900/20 py-1.5 rounded-lg border border-purple-800/30 hover:border-purple-600 font-bold transition-all">
                + Add Env Variable
              </button>
            </div>

            <button
              onClick={() => selected && void deploy(selected)}
              disabled={!selected || deploying}
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {deploying ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Deploying...
                </>
              ) : "🚀 Deploy Now"}
            </button>
          </div>
        </div>

        {deploying && (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">📡 Deployment Log</h3>
            <div className="space-y-2">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  {i < deployStep ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-white">✓</span>
                    </div>
                  ) : i === deployStep - 1 && deploying ? (
                    <svg className="animate-spin h-5 w-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-purple-800/40 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-mono ${i < deployStep ? "text-emerald-400" : i === deployStep - 1 && deploying ? "text-amber-400 animate-pulse" : "text-purple-700"}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(deployed).length > 0 && !deploying && (
          <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-5 mt-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-2">✅ Deployment Successful!</h3>
            <p className="text-xs text-emerald-400 mb-3">Your OCTOPUS OS is live. Share this URL with your team:</p>
            <div className="flex items-center gap-3 bg-[#0d0920] rounded-xl px-4 py-3 border border-emerald-800/30">
              <p className="text-sm font-mono text-white flex-1">https://octopus-os.render.com</p>
              <button className="text-xs text-emerald-400 hover:text-white font-bold">Copy</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
