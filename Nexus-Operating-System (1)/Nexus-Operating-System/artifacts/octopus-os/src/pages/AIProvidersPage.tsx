import { useState } from "react";

const PROVIDERS = [
  { name: "OpenAI", icon: "⚡", model: "gpt-4o", status: "active", priority: 1, cost: 4.28, requests: 892 },
  { name: "Gemini Pro", icon: "💎", model: "gemini-1.5-pro", status: "standby", priority: 2, cost: 1.12, requests: 0 },
  { name: "Claude 3.5", icon: "🔶", model: "claude-3-5-sonnet", status: "standby", priority: 3, cost: 0.84, requests: 0 },
  { name: "Grok", icon: "🚀", model: "grok-2", status: "standby", priority: 4, cost: 0.56, requests: 0 },
  { name: "DeepSeek", icon: "🌊", model: "deepseek-chat", status: "active", priority: 5, cost: 0.21, requests: 45 },
  { name: "Mistral", icon: "🌪️", model: "mistral-large", status: "disabled", priority: 6, cost: 0, requests: 0 },
  { name: "Cohere", icon: "🔵", model: "command-r-plus", status: "disabled", priority: 7, cost: 0, requests: 0 },
  { name: "Together AI", icon: "🤝", model: "llama-3-70b", status: "standby", priority: 8, cost: 0.09, requests: 0 },
  { name: "OpenRouter", icon: "🔀", model: "auto", status: "disabled", priority: 9, cost: 0, requests: 0 },
  { name: "Azure OpenAI", icon: "☁️", model: "gpt-4-turbo", status: "disabled", priority: 10, cost: 0, requests: 0 },
  { name: "Ollama", icon: "🦙", model: "llama3", status: "disabled", priority: 11, cost: 0, requests: 0 },
  { name: "LM Studio", icon: "🖥️", model: "local", status: "disabled", priority: 12, cost: 0, requests: 0 },
  { name: "Custom LLM", icon: "⚙️", model: "custom", status: "disabled", priority: 13, cost: 0, requests: 0 },
];

type Tab = "providers" | "failover" | "usage";

export function AIProvidersPage() {
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState(PROVIDERS);
  const [configOpen, setConfigOpen] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const toggleStatus = (name: string) => {
    setProviders(ps => ps.map(p => p.name === name ? { ...p, status: p.status === "disabled" ? "standby" : "disabled" } : p));
  };

  const testConnection = async (name: string) => {
    setTesting(name);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    setTestResult(r => ({ ...r, [name]: Math.random() > 0.25 ? "✅ 142ms — Connected" : "❌ Connection failed" }));
    setTesting(null);
  };

  const move = (name: string, dir: -1 | 1) => {
    setProviders(ps => {
      const arr = [...ps];
      const i = arr.findIndex(p => p.name === name);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return ps;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr.map((p, idx) => ({ ...p, priority: idx + 1 }));
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "providers", label: "Providers" },
    { id: "failover", label: "Auto-Failover Chain" },
    { id: "usage", label: "Usage & Cost" },
  ];

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🔮 AI Provider Manager</h1>
        <p className="text-purple-400/60 text-xs mt-1">Manage 13 AI providers · Auto-failover · Cost tracking</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#0d0920" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? "gradient-purple text-white" : "text-purple-400 hover:text-purple-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "providers" && (
        <div className="card-os overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                {["#", "Provider", "Model", "Status", "Requests", "Cost Today", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-purple-400/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.name} style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}
                  className="hover:bg-purple-900/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => move(p.name, -1)} className="text-purple-400/40 hover:text-purple-300 leading-none">▲</button>
                      <span className="text-purple-300 font-bold">{p.priority}</span>
                      <button onClick={() => move(p.name, 1)} className="text-purple-400/40 hover:text-purple-300 leading-none">▼</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-semibold text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-purple-400/60 font-mono">{p.model}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "active" ? "bg-emerald-900/50 text-emerald-400" :
                      p.status === "standby" ? "bg-blue-900/50 text-blue-400" :
                      "bg-gray-800 text-gray-500"
                    }`}>{p.status.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-white">{p.requests.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-400">${p.cost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleStatus(p.name)}
                        className={`w-8 h-4 rounded-full transition-all relative ${p.status !== "disabled" ? "bg-purple-600" : "bg-gray-700"}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${p.status !== "disabled" ? "left-4" : "left-0.5"}`}></div>
                      </button>
                      <button onClick={() => testConnection(p.name)}
                        disabled={testing === p.name}
                        className="px-2 py-1 rounded-md text-[10px] text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all disabled:opacity-50">
                        {testing === p.name ? "⟳" : testResult[p.name] ? testResult[p.name].split(" ")[0] : "Test"}
                      </button>
                      <button onClick={() => setConfigOpen(p.name)}
                        className="px-2 py-1 rounded-md text-[10px] text-purple-300 border border-purple-500/30 hover:border-purple-400/50">
                        Config
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "failover" && (
        <div className="max-w-lg">
          <p className="text-xs text-purple-400/60 mb-4">If a provider fails, the system automatically switches to the next one in the chain.</p>
          {providers.filter(p => p.status !== "disabled").map((p, i, arr) => (
            <div key={p.name} className="flex flex-col items-center">
              <div className={`w-full card-os p-4 flex items-center justify-between ${p.status === "active" ? "border-emerald-500/30" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{p.name}</div>
                    <div className="text-xs text-purple-400/60">{p.model}</div>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  p.status === "active" ? "bg-emerald-900/50 text-emerald-400" : "bg-blue-900/30 text-blue-400"
                }`}>{p.status === "active" ? "⚡ ACTIVE" : "STANDBY"}</span>
              </div>
              {i < arr.length - 1 && <div className="text-purple-500/40 text-lg my-1">↓</div>}
            </div>
          ))}
        </div>
      )}

      {tab === "usage" && (
        <div className="grid grid-cols-3 gap-4">
          {providers.filter(p => p.cost > 0 || p.requests > 0).map(p => (
            <div key={p.name} className="card-os p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{p.icon}</span>
                <span className="font-bold text-white text-sm">{p.name}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400/60">Requests</span>
                  <span className="text-white">{p.requests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400/60">Cost Today</span>
                  <span className="text-emerald-400">${p.cost.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div className="h-full rounded-full gradient-purple" style={{ width: `${Math.min(100, (p.requests / 1000) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          ))}
          <div className="col-span-3 card-os p-4 flex justify-between items-center">
            <span className="text-sm font-bold text-white">💰 Total Cost Today</span>
            <span className="text-xl font-bold text-emerald-400">${providers.reduce((s, p) => s + p.cost, 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card-os p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Configure — {configOpen}</h3>
              <button onClick={() => setConfigOpen(null)} className="text-purple-400 hover:text-white">✕</button>
            </div>
            {[["API Key", "sk-...", "password"], ["Base URL", "https://api.openai.com/v1", "text"],
              ["Model", "gpt-4o", "text"], ["Temperature", "0.7", "text"],
              ["Max Tokens", "4096", "text"], ["Timeout (s)", "30", "text"]].map(([label, ph, type]) => (
              <div key={label} className="mb-3">
                <label className="text-xs text-purple-400 mb-1 block">{label}</label>
                <input type={type} placeholder={ph}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                  style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.25)" }} />
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-400/50" onClick={() => setConfigOpen(null)}>Cancel</button>
              <button className="flex-1 py-2 rounded-lg text-xs text-white gradient-purple" onClick={() => setConfigOpen(null)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
