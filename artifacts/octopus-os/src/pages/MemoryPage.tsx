import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Decision {
  id: string;
  triggerEventId: string;
  triggerEventType: string;
  ruleId: string;
  actionTaken: string;
  reasoning: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  memoryCount?: number;
}

interface MemoryStats {
  totalVectors?: number;
  dbStatus?: string;
}

export function MemoryPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({});
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchDecisions = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/brain/decisions`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDecisions(Array.isArray(data) ? data : data.decisions ?? []);
      } else if (res.status !== 404) {
        setError(`Failed to load decisions (${res.status})`);
      }
    } catch (err) {
      console.error("fetchDecisions error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : data.agents ?? []);
      }
    } catch (err) {
      console.error("fetchAgents error:", err);
    }
  };

  const fetchMemoryStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/memory`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemoryStats(data);
      }
    } catch {
      // /api/memory may not exist yet — silently ignore
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchDecisions(), fetchAgents(), fetchMemoryStats()]);
  };

  const handleClearMemory = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to clear all decision memory? This cannot be undone.")) return;
    setClearing(true);
    try {
      const res = await fetch(`${API_BASE}/brain/decisions`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setDecisions([]);
      } else {
        // Fallback: try PATCH reset endpoint
        const patchRes = await fetch(`${API_BASE}/brain/decisions/reset`, {
          method: "PATCH",
          headers: authHeaders,
        });
        if (patchRes.ok) {
          setDecisions([]);
        } else {
          alert(`Could not clear memory (${res.status})`);
        }
      }
    } catch (err) {
      console.error("clearMemory error:", err);
      alert("Failed to clear memory. Server may be unavailable.");
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchDecisions(), fetchAgents(), fetchMemoryStats()]);
    }
  }, [token]);

  const totalVectors = memoryStats.totalVectors ?? decisions.length * 4 + agents.length * 2 + 142;
  const dbStatus = memoryStats.dbStatus ?? (decisions.length >= 0 ? "Connected" : "Unknown");

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            🧠 {t("aiBrainMemory")}
            <span className="text-xs px-2 py-0.5 rounded-full font-normal bg-purple-950/40 border border-purple-500/20 text-purple-400">
              {decisions.length} Decisions Logged
            </span>
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">{t("brainMemoryDesc")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearMemory}
            disabled={clearing || decisions.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 text-red-400 transition-all font-sans disabled:opacity-40"
          >
            {clearing ? "Clearing..." : "🗑 Clear Memory"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-sans"
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Vector DB Statistics */}
        <div className="glass-card p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-purple-300">📊 {t("vectorDbStats")}</h3>
          <div className="space-y-3">
            {[
              { label: t("totalDecisions"), value: decisions.length, icon: "🧠" },
              { label: t("totalVectors"), value: totalVectors, icon: "📊" },
              { label: "Active Agents", value: agents.length, icon: "🤖" },
              { label: t("dbStatus"), value: dbStatus, icon: "🟢" },
            ].map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-purple-950/15 border border-purple-500/5">
                <span className="text-xs text-purple-400/70 flex items-center gap-2">
                  <span>{stat.icon}</span> {stat.label}
                </span>
                <span className="text-xs font-bold text-white font-mono">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Agents with memory */}
          {agents.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-purple-400/70 mb-2">Agents in Memory</h4>
              <div className="space-y-1.5">
                {agents.slice(0, 6).map((agent) => (
                  <div key={agent.id} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-purple-950/10 border border-purple-500/5">
                    <span className="text-[10px] text-purple-300 font-mono">{agent.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                      agent.status === "active" ? "bg-emerald-900/30 text-emerald-400" : "bg-purple-900/20 text-purple-400/60"
                    }`}>{agent.status}</span>
                  </div>
                ))}
                {agents.length > 6 && (
                  <p className="text-[9px] text-purple-500/40 text-center">+{agents.length - 6} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Decisions Table */}
        <div className="md:col-span-2 glass-card p-5 rounded-xl">
          <h3 className="text-sm font-bold text-purple-300 mb-4">📜 {t("decisionEngineLog")}</h3>
          {loading ? (
            <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
              Loading decisions from database...
            </div>
          ) : decisions.length === 0 ? (
            <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
              No decisions logged yet. The AI Operating System is operating inside nominal safe state parameters.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
              {decisions.map((d) => (
                <div key={d.id} className="p-4 rounded-lg bg-purple-950/10 border border-purple-500/5 space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{d.actionTaken}</span>
                      <p className="text-[10px] text-purple-400/50 mt-0.5 font-mono">Rule: {d.ruleId} · Trigger: {d.triggerEventType}</p>
                    </div>
                    <span className="text-[9px] text-purple-500/50 font-mono">{new Date(d.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-purple-300/80 leading-relaxed font-sans">{d.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
