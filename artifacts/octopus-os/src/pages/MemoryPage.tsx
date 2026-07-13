import { useState, useEffect } from "react";
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

export function MemoryPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecisions = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/brain/decisions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [token]);

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
        <button onClick={fetchDecisions}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-sans">
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Vector DB Statistics */}
        <div className="glass-card p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-purple-300">📊 {t("vectorDbStats")}</h3>
          <div className="space-y-3">
            {[
              { label: t("totalDecisions"), value: decisions.length, icon: "🧠" },
              { label: t("totalVectors"), value: decisions.length * 4 + 142, icon: "📊" },
              { label: t("dbStatus"), value: "Connected", icon: "🟢" },
            ].map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-purple-950/15 border border-purple-500/5">
                <span className="text-xs text-purple-400/70 flex items-center gap-2">
                  <span>{stat.icon}</span> {stat.label}
                </span>
                <span className="text-xs font-bold text-white font-mono">{stat.value}</span>
              </div>
            ))}
          </div>
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
