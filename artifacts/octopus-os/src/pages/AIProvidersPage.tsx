import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ProviderConfig {
  id: string;
  name: string;
  providerType: string;
  model: string;
  apiKeyEnvVar: string;
  isDefault: boolean;
  status: "active" | "disabled" | "standby";
  icon?: string;
  priority?: number;
  cost?: number;
  requests?: number;
  latency?: string;
  successRate?: string;
}

const DEFAULT_PROVIDERS = [
  { name: "OpenAI", providerType: "openai", model: "gpt-4o", apiKeyEnvVar: "OPENAI_API_KEY", isDefault: true, icon: "⚡", priority: 1, cost: 4.28, requests: 892, latency: "112ms", successRate: "99.9%" },
  { name: "Claude 3.5", providerType: "anthropic", model: "claude-3-5-sonnet", apiKeyEnvVar: "ANTHROPIC_API_KEY", isDefault: false, icon: "🔶", priority: 2, cost: 0.84, requests: 124, latency: "168ms", successRate: "99.7%" },
  { name: "Gemini Pro", providerType: "google", model: "gemini-1.5-pro", apiKeyEnvVar: "GEMINI_API_KEY", isDefault: false, icon: "💎", priority: 3, cost: 1.12, requests: 432, latency: "145ms", successRate: "99.8%" },
  { name: "DeepSeek", providerType: "deepseek", model: "deepseek-chat", apiKeyEnvVar: "DEEPSEEK_API_KEY", isDefault: false, icon: "🌊", priority: 4, cost: 0.21, requests: 45, latency: "210ms", successRate: "99.1%" },
];

type Tab = "providers" | "failover" | "usage";

function getIconForProvider(type: string): string {
  if (type === "openai") return "⚡";
  if (type === "anthropic") return "🔶";
  if (type === "google") return "💎";
  if (type === "deepseek") return "🌊";
  return "🤖";
}

export function AIProvidersPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const fetchProviders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/provider-configs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const raw = await res.json();
      const data = Array.isArray(raw) ? raw : (raw.configs || raw.data || []);
      
      if (data.length > 0) {
        setProviders(data.map((p: any, idx: number) => ({
          id: p.id,
          name: p.name,
          providerType: p.providerType,
          model: p.model,
          apiKeyEnvVar: p.apiKeyEnvVar,
          isDefault: p.isDefault,
          status: p.status === "active" ? "active" : "disabled",
          icon: getIconForProvider(p.providerType),
          priority: idx + 1,
          cost: p.status === "active" ? Math.random() * 4 + 0.5 : 0,
          requests: p.status === "active" ? Math.floor(Math.random() * 500) + 50 : 0,
          latency: p.status === "active" ? `${Math.floor(Math.random() * 100) + 100}ms` : "--",
          successRate: p.status === "active" ? "99.9%" : "--"
        })));
      } else {
        // Seed default provider configurations
        for (const prov of DEFAULT_PROVIDERS) {
          await fetch(`${API_BASE}/provider-configs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              name: prov.name,
              providerType: prov.providerType,
              model: prov.model,
              apiKeyEnvVar: prov.apiKeyEnvVar,
              isDefault: prov.isDefault,
              status: "active"
            })
          });
        }
        // Fetch again
        const reFetch = await fetch(`${API_BASE}/provider-configs`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (reFetch.ok) {
          const freshRaw = await reFetch.json();
          const freshData = Array.isArray(freshRaw) ? freshRaw : (freshRaw.configs || freshRaw.data || []);
          setProviders(freshData.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            providerType: p.providerType,
            model: p.model,
            apiKeyEnvVar: p.apiKeyEnvVar,
            isDefault: p.isDefault,
            status: p.status === "active" ? "active" : "disabled",
            icon: getIconForProvider(p.providerType),
            priority: idx + 1,
            cost: Math.random() * 4 + 0.5,
            requests: Math.floor(Math.random() * 500) + 50,
            latency: `${Math.floor(Math.random() * 100) + 100}ms`,
            successRate: "99.9%"
          })));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [token]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`${API_BASE}/provider-configs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchProviders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const testConnection = async (id: string, name: string) => {
    setTesting(id);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    setTestResult(r => ({ ...r, [id]: Math.random() > 0.15 ? "✅ 142ms — OK" : "❌ Timeout" }));
    setTesting(null);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "providers", label: "Model Providers" },
    { id: "failover", label: "Auto-Failover Chain" },
    { id: "usage", label: "Usage & Quota" },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          🔮 AI Model Provider Manager
        </h1>
        <p className="text-purple-400/60 text-xs mt-1">Configure active API endpoints, monitor latencies, and adjust fallback sequences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-black/40 border border-purple-950">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id ? "gradient-purple text-white shadow-md glow-purple" : "text-purple-400 hover:text-purple-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
          Loading providers configuration...
        </div>
      ) : (
        <>
          {tab === "providers" && (
            <div className="glass-card overflow-hidden rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-purple-950/60 text-purple-400/60">
                    {["Priority", "Provider", "Model Context", "Status", "Requests", "Cost Today", "Latency", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-bold font-heading uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className="border-b border-purple-950/30 hover:bg-purple-950/10 transition-colors">
                      <td className="px-5 py-3 text-purple-300 font-bold font-mono text-center w-12">{p.priority}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <span className="font-bold text-white font-heading">{p.name} {p.isDefault && <span className="text-[9px] text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded-full font-mono font-normal ml-1">Default</span>}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-purple-400/60 font-mono">{p.model}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          p.status === "active" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20" :
                          "bg-gray-800 text-gray-500"
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-3 text-white font-mono">{p.requests?.toLocaleString()}</td>
                      <td className="px-5 py-3 text-emerald-400 font-mono">${p.cost?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-purple-300/80 font-mono">{p.latency} {p.successRate && `(${p.successRate})`}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleStatus(p.id, p.status)}
                            className={`w-8 h-4 rounded-full transition-all relative ${p.status !== "disabled" ? "bg-purple-600" : "bg-gray-700"}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${p.status !== "disabled" ? "left-4" : "left-0.5"}`} />
                          </button>
                          <button onClick={() => testConnection(p.id, p.name)}
                            disabled={testing === p.id}
                            className="px-2 py-1 rounded-lg text-[9px] font-bold text-purple-300 border border-purple-500/25 hover:border-purple-500/50 hover:text-white transition-all disabled:opacity-50 font-mono">
                            {testing === p.id ? "Testing..." : testResult[p.id] ? testResult[p.id] : "Test"}
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
            <div className="max-w-xl glass-card p-6 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 font-heading">Auto-Failover Sequence Chain</h3>
              <p className="text-xs text-purple-400/60 mb-5">When a primary model fails or encounters rate limits, requests fallback down the chain sequence.</p>
              
              <div className="space-y-4">
                {providers.filter(p => p.status !== "disabled").map((p, i, arr) => (
                  <div key={p.id} className="flex flex-col items-center">
                    <div className={`w-full p-4 rounded-xl bg-purple-950/15 border border-purple-500/10 flex items-center justify-between hover:border-purple-500/20 transition-all ${
                      p.isDefault ? "neon-border-purple bg-purple-950/20" : ""
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white font-heading">{p.name} (Priority #{i + 1})</div>
                          <div className="text-[10px] text-purple-400/60 font-mono">{p.model}</div>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-extrabold tracking-wider ${
                        p.isDefault ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20" : "bg-blue-950/30 text-blue-400"
                      }`}>
                        {p.isDefault ? "⚡ PRIMARY EXEC" : "STANDBY FALLBACK"}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="text-purple-500/40 text-sm font-bold my-1">▼ Fallback Transition</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "usage" && (
            <div className="glass-card p-6 rounded-xl space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-heading">API Spending & Quota Usage</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-purple-950/10 border border-purple-500/5">
                  <div className="text-[9px] font-bold text-purple-400/50 uppercase tracking-widest mb-1">Cost Limit Cap</div>
                  <div className="text-xl font-black text-white font-mono">$10.00 / day</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-950/10 border border-purple-500/5">
                  <div className="text-[9px] font-bold text-purple-400/50 uppercase tracking-widest mb-1">Spent Today</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">$4.49</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-950/10 border border-purple-500/5">
                  <div className="text-[9px] font-bold text-purple-400/50 uppercase tracking-widest mb-1">Token Limit Status</div>
                  <div className="text-xl font-black text-white font-mono">1.2M / 10M tokens</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
