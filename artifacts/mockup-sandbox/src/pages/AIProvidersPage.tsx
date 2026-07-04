import { useState } from "react";

interface Provider {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  apiKey: string;
  secret: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  priority: number;
  enabled: boolean;
  isLocal: boolean;
  status: "online" | "offline" | "unconfigured" | "testing";
  latency?: number;
  costPer1k?: number;
  usageToday?: number;
  usageLimit?: number;
}

const DEFAULT_PROVIDERS: Provider[] = [
  { id: "openai",       name: "openai",       displayName: "OpenAI",       icon: "🟢", apiKey: "", secret: "", baseUrl: "https://api.openai.com/v1",                 model: "gpt-4o",               temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 1, enabled: true,  isLocal: false, status: "online",       latency: 312, costPer1k: 0.01,  usageToday: 12450, usageLimit: 50000 },
  { id: "gemini",       name: "gemini",       displayName: "Gemini",       icon: "🔵", apiKey: "", secret: "", baseUrl: "https://generativelanguage.googleapis.com",  model: "gemini-1.5-pro",       temperature: 0.7, maxTokens: 8192, timeout: 30, priority: 2, enabled: true,  isLocal: false, status: "online",       latency: 198, costPer1k: 0.007, usageToday: 3200,  usageLimit: 50000 },
  { id: "claude",       name: "claude",       displayName: "Claude",       icon: "🟠", apiKey: "", secret: "", baseUrl: "https://api.anthropic.com/v1",               model: "claude-3-5-sonnet",    temperature: 0.7, maxTokens: 8192, timeout: 30, priority: 3, enabled: true,  isLocal: false, status: "offline",      latency: undefined, costPer1k: 0.015, usageToday: 0, usageLimit: 50000 },
  { id: "grok",         name: "grok",         displayName: "Grok",         icon: "⚫", apiKey: "", secret: "", baseUrl: "https://api.x.ai/v1",                       model: "grok-2-1212",          temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 4, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0.005, usageToday: 0, usageLimit: 50000 },
  { id: "deepseek",     name: "deepseek",     displayName: "DeepSeek",     icon: "🐬", apiKey: "", secret: "", baseUrl: "https://api.deepseek.com/v1",               model: "deepseek-chat",        temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 5, enabled: true,  isLocal: false, status: "online",       latency: 445, costPer1k: 0.0014, usageToday: 890, usageLimit: 50000 },
  { id: "mistral",      name: "mistral",      displayName: "Mistral",      icon: "🟤", apiKey: "", secret: "", baseUrl: "https://api.mistral.ai/v1",                 model: "mistral-large-latest", temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 6, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0.008, usageToday: 0, usageLimit: 50000 },
  { id: "cohere",       name: "cohere",       displayName: "Cohere",       icon: "🟡", apiKey: "", secret: "", baseUrl: "https://api.cohere.ai/v1",                  model: "command-r-plus",       temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 7, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0.003, usageToday: 0, usageLimit: 50000 },
  { id: "together",     name: "together",     displayName: "Together AI",  icon: "🔴", apiKey: "", secret: "", baseUrl: "https://api.together.xyz/v1",               model: "meta-llama/Llama-3-8b-chat-hf", temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 8, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0.0002, usageToday: 0, usageLimit: 50000 },
  { id: "openrouter",   name: "openrouter",   displayName: "OpenRouter",   icon: "🌐", apiKey: "", secret: "", baseUrl: "https://openrouter.ai/api/v1",              model: "openai/gpt-4o",        temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 9, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0.005, usageToday: 0, usageLimit: 50000 },
  { id: "azure",        name: "azure",        displayName: "Azure OpenAI", icon: "☁️", apiKey: "", secret: "", baseUrl: "https://YOUR-RESOURCE.openai.azure.com/",  model: "gpt-4o",               temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 10, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0.01, usageToday: 0, usageLimit: 50000 },
  { id: "ollama",       name: "ollama",       displayName: "Ollama",       icon: "🦙", apiKey: "local", secret: "", baseUrl: "http://localhost:11434/v1",            model: "llama3",               temperature: 0.7, maxTokens: 4096, timeout: 60, priority: 11, enabled: false, isLocal: true,  status: "unconfigured", latency: undefined, costPer1k: 0, usageToday: 0, usageLimit: 0 },
  { id: "lmstudio",     name: "lmstudio",     displayName: "LM Studio",    icon: "🎛️", apiKey: "local", secret: "", baseUrl: "http://localhost:1234/v1",            model: "local-model",          temperature: 0.7, maxTokens: 4096, timeout: 60, priority: 12, enabled: false, isLocal: true,  status: "unconfigured", latency: undefined, costPer1k: 0, usageToday: 0, usageLimit: 0 },
  { id: "custom",       name: "custom",       displayName: "Custom",       icon: "⚙️", apiKey: "", secret: "", baseUrl: "",                                         model: "",                     temperature: 0.7, maxTokens: 4096, timeout: 30, priority: 13, enabled: false, isLocal: false, status: "unconfigured", latency: undefined, costPer1k: 0, usageToday: 0, usageLimit: 0 },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  online:       { label: "Online",       dot: "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse", text: "text-emerald-400" },
  offline:      { label: "Offline",      dot: "bg-red-500",    text: "text-red-400" },
  unconfigured: { label: "Not Set",      dot: "bg-gray-700",   text: "text-gray-500" },
  testing:      { label: "Testing...",   dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
};

export function AIProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>(DEFAULT_PROVIDERS);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [form, setForm] = useState<Partial<Provider>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "failover" | "usage">("list");

  const openConfig = (p: Provider) => {
    setSelected(p);
    setForm({ ...p });
  };

  const save = () => {
    if (!selected) return;
    setProviders((prev) => prev.map((p) => p.id === selected.id ? { ...p, ...form } : p));
    setSelected(null);
  };

  const testConn = async (id: string) => {
    setTesting(id);
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: "testing" } : p));
    await new Promise((r) => setTimeout(r, 1400));
    const ok = Math.random() > 0.3;
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: ok ? "online" : "offline", latency: ok ? Math.floor(Math.random() * 500 + 100) : undefined } : p));
    setTesting(null);
  };

  const toggleEnabled = (id: string) => {
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const movePriority = (id: string, dir: -1 | 1) => {
    setProviders((prev) => {
      const list = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = list.findIndex((p) => p.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= list.length) return prev;
      [list[idx].priority, list[newIdx].priority] = [list[newIdx].priority, list[idx].priority];
      return [...list];
    });
  };

  const sorted = [...providers].sort((a, b) => a.priority - b.priority);
  const failoverChain = sorted.filter((p) => p.enabled);
  const online = providers.filter((p) => p.status === "online").length;
  const totalUsage = providers.reduce((s, p) => s + (p.usageToday ?? 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-white">🔮 AI Provider Manager</h1>
            <p className="text-purple-400 text-xs mt-0.5">
              {online} online · Auto-Failover active · {totalUsage.toLocaleString()} tokens used today
            </p>
          </div>
          <button onClick={() => openConfig({ ...DEFAULT_PROVIDERS.find((p) => p.id === "custom")! })} className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl">
            + Custom Provider
          </button>
        </div>

        <div className="flex gap-1 bg-[#130d2a] border border-purple-900/40 rounded-xl p-1 mb-5 w-fit">
          {([
            { id: "list", label: "📋 All Providers" },
            { id: "failover", label: "⚡ Failover Chain" },
            { id: "usage", label: "📊 Usage & Cost" },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === id ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white" : "text-purple-500 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "list" && (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-purple-900/40 text-left">
                  {["#", "Provider", "Model", "Status", "Latency", "Cost/1K", "Priority", "Enabled", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-purple-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const s = STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                      <td className="px-4 py-3 font-mono text-purple-700">{p.priority}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <div>
                            <p className="font-bold text-white">{p.displayName}</p>
                            {p.isLocal && <span className="text-[9px] text-blue-400 font-mono">LOCAL</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-300">{p.model || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                          <span className={s.text}>{s.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-300">{p.latency ? `${p.latency}ms` : "—"}</td>
                      <td className="px-4 py-3 font-mono text-purple-300">{p.isLocal ? "Free" : p.costPer1k ? `$${p.costPer1k}` : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => movePriority(p.id, -1)} className="text-purple-600 hover:text-white w-5 text-center">↑</button>
                          <button onClick={() => movePriority(p.id, 1)} className="text-purple-600 hover:text-white w-5 text-center">↓</button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={p.enabled} onChange={() => toggleEnabled(p.id)} className="sr-only peer" />
                          <div className="w-8 h-4 bg-gray-700 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => void testConn(p.id)}
                            disabled={testing === p.id}
                            className="text-[10px] bg-blue-900/20 text-blue-300 border border-blue-800/30 hover:border-blue-600 px-2 py-1 rounded transition-all font-bold"
                          >
                            {testing === p.id ? "..." : "Test"}
                          </button>
                          <button
                            onClick={() => openConfig(p)}
                            className="text-[10px] bg-purple-900/20 text-purple-300 border border-purple-800/30 hover:border-purple-600 px-2 py-1 rounded transition-all font-bold"
                          >
                            Config
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "failover" && (
          <div>
            <div className="mb-4 bg-[#130d2a] border border-blue-800/40 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-1">⚡ Auto-Failover System</h3>
              <p className="text-xs text-purple-400">When a provider fails or is rate-limited, OCTOPUS automatically switches to the next enabled provider in priority order — without any interruption.</p>
            </div>
            <div className="flex flex-col gap-3 max-w-lg">
              {failoverChain.map((p, i) => {
                const s = STATUS_CONFIG[p.status];
                return (
                  <div key={p.id}>
                    <div className={`flex items-center gap-4 p-4 rounded-xl border ${p.status === "online" ? "bg-emerald-900/10 border-emerald-800/40" : p.status === "offline" ? "bg-red-900/10 border-red-800/30 opacity-60" : "bg-[#130d2a] border-purple-900/40"}`}>
                      <div className="flex items-center gap-2 w-6">
                        <span className="text-xs font-mono text-purple-600">#{i + 1}</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
                      <span className="text-xl">{p.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{p.displayName}</p>
                        <p className="text-[10px] text-purple-500">{p.model} · {p.latency ? `${p.latency}ms` : "Offline"}</p>
                      </div>
                      {p.status === "offline" && (
                        <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-800/30 px-2 py-0.5 rounded-full font-mono">SKIP</span>
                      )}
                      {p.status === "online" && i === 0 && (
                        <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/30 px-2 py-0.5 rounded-full font-mono">ACTIVE</span>
                      )}
                    </div>
                    {i < failoverChain.length - 1 && (
                      <div className="flex justify-center my-1">
                        <span className={`text-sm ${p.status === "online" && failoverChain[i + 1]?.status === "online" ? "text-purple-700" : "text-purple-900"}`}>↓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "usage" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.filter((p) => p.usageToday !== undefined && p.usageToday > 0).map((p) => {
              const pct = p.usageLimit ? Math.round(((p.usageToday ?? 0) / p.usageLimit) * 100) : 0;
              const cost = ((p.usageToday ?? 0) / 1000) * (p.costPer1k ?? 0);
              return (
                <div key={p.id} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>{p.icon}</span>
                    <p className="text-sm font-bold text-white">{p.displayName}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-500">Tokens Today</span>
                      <span className="text-white font-mono">{(p.usageToday ?? 0).toLocaleString()}</span>
                    </div>
                    {p.usageLimit ? (
                      <>
                        <div className="w-full bg-[#0d0920] rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${pct > 80 ? "bg-red-500" : "bg-gradient-to-r from-purple-600 to-indigo-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-purple-600">{pct}% of {(p.usageLimit ?? 0).toLocaleString()} limit</p>
                      </>
                    ) : null}
                    <div className="flex justify-between text-xs mt-2 pt-2 border-t border-purple-900/20">
                      <span className="text-purple-500">Cost Today</span>
                      <span className="text-amber-400 font-mono font-bold">${cost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Config Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#130d2a] border border-purple-800/60 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <span>{selected.icon}</span> Configure {selected.displayName}
              </h2>
              {selected.isLocal && (
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-3 mb-4 text-xs text-blue-300">
                  📍 Local provider — runs on your machine. No API key required.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { key: "apiKey",   label: "API Key",   type: selected.isLocal ? "text" : "password", placeholder: selected.isLocal ? "local" : "sk-..." },
                  { key: "secret",   label: "Secret",    type: "password", placeholder: "Optional secret" },
                  { key: "baseUrl",  label: "Base URL",  type: "text",     placeholder: "https://api.openai.com/v1" },
                  { key: "model",    label: "Model",     type: "text",     placeholder: "gpt-4o" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className={key === "baseUrl" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(form[key as keyof Provider] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2 text-white text-xs placeholder-purple-700 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { key: "temperature", label: "Temperature", min: 0, max: 2, step: 0.1 },
                  { key: "maxTokens",   label: "Max Tokens",  min: 256, max: 32768, step: 256 },
                  { key: "timeout",     label: "Timeout (s)", min: 5, max: 120, step: 5 },
                ].map(({ key, label, min, max, step }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input
                      type="number"
                      min={min} max={max} step={step}
                      value={(form[key as keyof Provider] as number) ?? 0}
                      onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) })}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.enabled ?? false} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-purple-600 w-4 h-4" />
                  <span className="text-xs text-purple-300 font-semibold">Enabled</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={save} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm">Save</button>
                <button
                  onClick={() => { if (selected) void testConn(selected.id); setSelected(null); }}
                  className="flex-1 bg-blue-900/20 text-blue-300 font-bold py-2.5 rounded-xl text-sm border border-blue-800/40"
                >
                  Test Connection
                </button>
                <button onClick={() => setSelected(null)} className="flex-1 bg-[#0d0920] text-purple-300 font-bold py-2.5 rounded-xl text-sm border border-purple-800/40">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
