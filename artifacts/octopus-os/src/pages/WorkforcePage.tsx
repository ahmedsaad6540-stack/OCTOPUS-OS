import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Worker {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "active" | "disabled" | "paused";
  workload: string;
  cpu: number;
  requests: number;
  instructions: string;
  performance: string;
  memory: string;
}

const DEFAULT_AGENTS = [
  { name: "Brain Agent", role: "Central Intelligence", icon: "🧠", instructions: "Coordinate inputs from all sub-agents. Execute daily profit optimization calculations." },
  { name: "TrendHunter", role: "Niche Trend Scanner", icon: "📈", instructions: "Identify hashtags and product keywords with >75 viral score. Forward signals to Clickbank adapter." },
  { name: "Creator Agent", role: "Content & Script Writer", icon: "✍️", instructions: "Write high-converting, short-form scripts optimized for TikTok retention algorithms." },
  { name: "Publisher Agent", role: "Social Scheduler", icon: "📱", instructions: "Upload and schedule posts. Sync publish metadata across linked platforms." },
  { name: "Tracker Agent", role: "Pixel Analytics Monitor", icon: "📊", instructions: "Monitor conversion anomalies. Send notification if conversion rate drops by >15%." },
  { name: "Money Agent", role: "Earnings Ledger Sync", icon: "💰", instructions: "Fetch Clickbank earnings daily. Refresh ROI and EPC metric dashboards." },
];

function getIconForName(name: string): string {
  if (name.includes("Brain")) return "🧠";
  if (name.includes("Trend")) return "📈";
  if (name.includes("Creator")) return "✍️";
  if (name.includes("Publisher")) return "📱";
  if (name.includes("Tracker")) return "📊";
  if (name.includes("Money")) return "💰";
  return "🤖";
}

export function WorkforcePage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempInstructions, setTempInstructions] = useState("");

  const fetchWorkers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.length > 0) {
        setWorkers(data.map((w: any) => ({
          id: w.id,
          name: w.name,
          role: w.description || "Virtual Agent",
          icon: getIconForName(w.name),
          status: w.status === "active" ? "active" : "disabled",
          workload: w.status === "active" ? "Running diagnostics cycle" : "Idle",
          cpu: w.status === "active" ? Math.floor(Math.random() * 45) + 15 : 0,
          requests: w.status === "active" ? Math.floor(Math.random() * 120) + 10 : 0,
          instructions: w.instructions,
          performance: w.status === "active" ? "Optimal" : "Offline",
          memory: "Cached context"
        })));
      } else {
        // Seed initial agents in the database
        for (const agent of DEFAULT_AGENTS) {
          await fetch(`${API_BASE}/agents`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              name: agent.name,
              instructions: agent.instructions,
              description: agent.role,
              status: "active"
            })
          });
        }
        // Fetch again
        const reFetch = await fetch(`${API_BASE}/agents`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (reFetch.ok) {
          const freshData = await reFetch.json();
          setWorkers(freshData.map((w: any) => ({
            id: w.id,
            name: w.name,
            role: w.description || "Virtual Agent",
            icon: getIconForName(w.name),
            status: w.status === "active" ? "active" : "disabled",
            workload: "Running diagnostics cycle",
            cpu: Math.floor(Math.random() * 45) + 15,
            requests: Math.floor(Math.random() * 120) + 10,
            instructions: w.instructions,
            performance: "Optimal",
            memory: "Cached context"
          })));
        }
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [token]);

  const handleToggleStatus = async (worker: Worker) => {
    if (!token) return;
    const isActivating = worker.status !== "active";
    const endpoint = `/api/agents/${worker.id}/${isActivating ? "enable" : "disable"}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setWorkers(prev => prev.map(w => w.id === worker.id ? {
          ...w,
          status: isActivating ? "active" : "disabled",
          cpu: isActivating ? 15 : 0,
          requests: isActivating ? 5 : 0
        } : w));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditInstructions = (w: Worker) => {
    setEditingId(w.id);
    setTempInstructions(w.instructions);
  };

  const handleSaveInstructions = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ instructions: tempInstructions })
      });
      if (res.ok) {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, instructions: tempInstructions } : w));
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloneWorker = async (w: Worker) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${w.name} (Clone)`,
          instructions: w.instructions,
          description: w.role,
          status: "disabled"
        })
      });
      if (res.ok) {
        fetchWorkers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setWorkers(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            👥 {t("aiWorkforcePanel")}
            <span className="text-xs px-2 py-0.5 rounded-full font-normal bg-purple-950/40 border border-purple-500/20 text-purple-400 font-mono">
              {workers.filter(w => w.status === "active").length}/{workers.length} {t("active").toUpperCase()}
            </span>
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">{t("workforceDesc")}</p>
        </div>
        <button onClick={fetchWorkers}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-sans">
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-purple-400/50 text-xs font-mono">
          Loading Virtual Workforce...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workers.map((w) => (
            <div key={w.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div>
                {/* Header Info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${
                      w.status === "active" ? "gradient-purple glow-purple" : "bg-gray-800/80"
                    }`}>
                      {w.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-heading">{w.name}</h3>
                      <p className="text-[10px] text-purple-400/60 font-mono mt-0.5">{w.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      w.status === "active" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20" :
                      w.status === "paused" ? "bg-blue-950/50 text-blue-400 border border-blue-500/20" :
                      "bg-gray-800 text-gray-500"
                    }`}>{t(w.status)}</span>
                  </div>
                </div>

                {/* Workload / Live task */}
                <div className="mb-4">
                  <div className="text-[10px] text-purple-500/40 uppercase font-bold tracking-wider mb-1">{t("currentJob")}</div>
                  <div className="text-xs text-white/90 font-medium">↳ {w.workload}</div>
                </div>

                {/* Instructions Editor */}
                <div className="mb-4 bg-black/30 rounded-xl p-3 border border-purple-950">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-purple-400/60 uppercase font-bold">{t("executionPrompt")}</span>
                    {editingId !== w.id ? (
                      <button onClick={() => handleEditInstructions(w)} className="text-[10px] text-purple-400 hover:text-purple-300 font-sans">Edit</button>
                    ) : (
                      <button onClick={() => handleSaveInstructions(w.id)} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold font-sans">{t("save")}</button>
                    )}
                  </div>
                  {editingId === w.id ? (
                    <textarea value={tempInstructions} onChange={(e) => setTempInstructions(e.target.value)}
                      className="w-full bg-black/60 rounded-lg p-2 text-xs text-white outline-none border border-purple-500/30 font-mono" rows={3} />
                  ) : (
                    <p className="text-xs text-purple-300/80 leading-relaxed font-sans">{w.instructions}</p>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-3 mb-5 text-[11px] p-2 bg-purple-950/10 rounded-lg border border-purple-500/5">
                  <div>
                    <span className="text-purple-400/40">{t("performance")}:</span>{" "}
                    <span className="text-white font-medium">{w.performance}</span>
                  </div>
                  <div>
                    <span className="text-purple-400/40">{t("memoryContext")}:</span>{" "}
                    <span className="text-white font-medium truncate block">{w.memory}</span>
                  </div>
                </div>

                {/* Vitals row */}
                <div className="flex items-center justify-between text-[10px] text-purple-400/70 mb-5">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-16 h-1.5 rounded-full bg-purple-950 overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${w.cpu}%` }} />
                    </div>
                    <span>CPU {w.cpu}%</span>
                  </div>
                  <span>{w.requests} requests/hr</span>
                </div>
              </div>

              {/* Actions Controls panel */}
              <div className="flex items-center justify-between pt-3 border-t border-purple-950/60">
                <div className="flex gap-1.5">
                  <button onClick={() => handleToggleStatus(w)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      w.status === "active" ? "bg-amber-950/40 hover:bg-amber-950/60 text-amber-400 border border-amber-500/20" :
                      "bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-400 border border-emerald-500/20"
                    }`}>
                    {w.status === "active" ? `⏸ Disable` : `▶ Enable`}
                  </button>
                  <button onClick={() => handleCloneWorker(w)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/20 font-sans">
                    {t("clone")}
                  </button>
                </div>
                <button onClick={() => handleDeleteWorker(w.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-500/20 transition-all font-sans">
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
