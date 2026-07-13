import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: "active" | "disabled";
  task: string;
  cpu: number;
  requests: number;
  description: string;
}

const DEFAULT_AGENTS = [
  { name: "Brain Agent", icon: "🧠", task: "Analyzing trending niches", cpu: 42, requests: 892, desc: "Central intelligence — synthesizes all data, drives strategic decisions." },
  { name: "TrendHunter", icon: "📈", task: "Scanning TikTok trends", cpu: 67, requests: 234, desc: "Detects viral trends 48h early across TikTok, YouTube, and Instagram." },
  { name: "Creator Agent", icon: "✍️", task: "Writing video scripts", cpu: 38, requests: 156, desc: "Generates unique, platform-optimized video scripts and content." },
  { name: "Publisher Agent", icon: "📢", task: "Schedules and publishes", cpu: 5, requests: 92, desc: "Schedules and publishes content across all connected social platforms." },
  { name: "Tracker Agent", icon: "📊", task: "Monitoring Campaign #1", cpu: 28, requests: 88, desc: "Real-time campaign monitoring, anomaly detection, performance alerts." },
  { name: "Money Agent", icon: "💰", task: "Calculating ROI reports", cpu: 19, requests: 45, desc: "Tracks affiliate earnings, calculates ROI, optimizes revenue streams." },
];

function getIconForAgent(name: string): string {
  if (name.includes("Brain")) return "🧠";
  if (name.includes("Trend")) return "📈";
  if (name.includes("Creator")) return "✍️";
  if (name.includes("Publisher")) return "📢";
  if (name.includes("Tracker")) return "📊";
  if (name.includes("Money")) return "💰";
  return "🤖";
}

export function AgentsPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAgents = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/agents", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.length > 0) {
        setAgents(data.map((w: any) => ({
          id: w.id,
          name: w.name,
          icon: getIconForAgent(w.name),
          status: w.status === "active" ? "active" : "disabled",
          task: w.status === "active" ? "Running operations loop" : "Idle",
          cpu: w.status === "active" ? Math.floor(Math.random() * 50) + 20 : 0,
          requests: w.status === "active" ? Math.floor(Math.random() * 200) + 10 : 0,
          description: w.description || "Virtual Agent"
        })));
      } else {
        // Seed default agents in database
        for (const agent of DEFAULT_AGENTS) {
          await fetch("/api/agents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              name: agent.name,
              instructions: agent.desc,
              description: agent.desc,
              status: "active"
            })
          });
        }
        // Fetch again
        const reFetch = await fetch("/api/agents", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (reFetch.ok) {
          const freshData = await reFetch.json();
          setAgents(freshData.map((w: any) => ({
            id: w.id,
            name: w.name,
            icon: getIconForAgent(w.name),
            status: w.status === "active" ? "active" : "disabled",
            task: "Running operations loop",
            cpu: Math.floor(Math.random() * 50) + 20,
            requests: Math.floor(Math.random() * 200) + 10,
            description: w.description || "Virtual Agent"
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
    fetchAgents();
  }, [token]);

  const toggleAgent = async (id: string, currentStatus: string) => {
    if (!token) return;
    const isActivating = currentStatus !== "active";
    const endpoint = `/api/agents/${id}/${isActivating ? "enable" : "disable"}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAgents(prev => prev.map(a => a.id === id ? {
          ...a,
          status: isActivating ? "active" : "disabled",
          cpu: isActivating ? 25 : 0,
          requests: isActivating ? 10 : 0
        } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runAgentNow = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/agents/${id}/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: "Trigger execution block manually." })
      });
      alert("Agent execution triggered successfully via backend REST API!");
      fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#06020f" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">🤖 AI Agents</h1>
          <p className="text-purple-400/60 text-xs mt-1">
            {agents.filter(a => a.status === "active").length} {t("active")} · {agents.filter(a => a.status === "disabled").length} {t("disabled")}
          </p>
        </div>
        <button onClick={fetchAgents} className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-sans">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
          Loading AI Agents...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map(a => (
            <div key={a.id} className="glass-card overflow-hidden rounded-2xl border border-purple-950/60 flex flex-col justify-between">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${a.status === "active" ? "gradient-purple glow-purple" : "bg-gray-800/80"}`}>
                      {a.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-heading">{a.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-400" : "bg-gray-600"}`}
                          style={a.status === "active" ? { boxShadow: "0 0 6px #10b981" } : {}}></div>
                        <span className={`text-[10px] uppercase font-bold ${a.status === "active" ? "text-emerald-400" : "text-gray-500"}`}>
                          {t(a.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => toggleAgent(a.id, a.status)}
                      className={`w-9 h-5 rounded-full transition-all relative ${a.status === "active" ? "bg-purple-600" : "bg-gray-700"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${a.status === "active" ? "left-4" : "left-0.5"}`}></div>
                    </button>
                    <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                      className="text-purple-400 text-xs hover:text-purple-300 transition-all font-sans">{expanded === a.id ? "▲" : "▼"}</button>
                  </div>
                </div>

                <div className="text-xs text-purple-400/60 mb-3 font-mono">↳ {a.task}</div>

                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-purple-950/40">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${a.cpu}%`, background: a.cpu > 60 ? "#ef4444" : "#7c3aed" }}></div>
                  </div>
                  <span className="text-purple-400/60 w-12 text-right font-mono">CPU {a.cpu}%</span>
                  <span className="text-purple-400/60 w-16 text-right font-mono">{a.requests} req/hr</span>
                </div>
              </div>

              {expanded === a.id && (
                <div className="px-5 pb-5 pt-4 border-t border-purple-950/60 bg-purple-950/5">
                  <p className="text-xs text-purple-300/70 mb-4 leading-relaxed font-sans">{a.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => runAgentNow(a.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-white gradient-purple font-sans">▶ Run Now</button>
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-purple-300 border border-purple-500/20 hover:bg-purple-950/30 transition-all font-sans">✏️ Edit Prompt</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
