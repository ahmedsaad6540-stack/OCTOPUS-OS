import { useState, useEffect, useRef } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ── Toast helper ──────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface ToastMsg { id: number; type: ToastType; text: string; }

function Toast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md pointer-events-auto transition-all ${
            t.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
              : t.type === "info"
              ? "bg-purple-950/80 border-purple-500/30 text-purple-200"
              : "bg-red-950/80 border-red-500/30 text-red-300"
          }`}
        >
          {t.type === "success" ? "✅" : t.type === "info" ? "🔔" : "❌"} {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  resourceType: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface ApiKey {
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

interface SessionInfo {
  device: string;
  browser: string;
  ip: string;
  location: string;
  active: boolean;
  time: string;
}

// ── Helper ───────────────────────────────────────────────────────────────────
function formatRelative(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } catch {
    return dateStr;
  }
}

export function SecurityPage() {
  const { token } = useAuth();

  // State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  const addToast = (type: ToastType, text: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Fetch API keys and sessions
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/security`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { apiKeys: ApiKey[]; sessions: SessionInfo[] }) => {
        setApiKeys(data.apiKeys ?? []);
        setSessions(data.sessions ?? []);
      })
      .catch(err => addToast('error', `Failed to load security data: ${err?.message}`));
  }, [token]);

  // Fetch audit log
  useEffect(() => {
    if (!token) return;
    setAuditLoading(true);
    setAuditError(null);
    fetch(`${API_BASE}/audit-log`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { entries: AuditEntry[] }) => setAuditEntries(data.entries ?? []))
      .catch(err => setAuditError(err?.message ?? 'Failed to load audit log.'))
      .finally(() => setAuditLoading(false));
  }, [token]);

  const handleComingSoon = (action: string) =>
    addToast('info', `${action} — coming soon! No backend route exists yet.`);

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <Toast toasts={toasts} />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🔐 Security Center</h1>
        <p className="text-purple-400/60 text-xs mt-1">API Keys · Sessions · Audit Log · Vault</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {/* API Keys */}
        <div className="card-os p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-purple-300">🔑 API Keys</h3>
            <button onClick={() => handleComingSoon('Generate API Key')} className="px-3 py-1.5 rounded-lg text-xs text-white gradient-purple">+ Generate</button>
          </div>
          <p className="text-[10px] text-purple-400/40 italic mb-3">Real session management coming soon</p>
          <div className="space-y-3">
            {apiKeys.map(k => (
              <div key={k.name} className="p-3 rounded-lg" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{k.name}</span>
                  <button onClick={() => handleComingSoon('Revoke API Key')} className="text-red-400/60 hover:text-red-400 text-xs">Revoke</button>
                </div>
                <div className="font-mono text-xs text-purple-400/60 mb-2">{k.key}</div>
                <div className="flex justify-between text-[10px] text-purple-400/40"><span>Created {k.created}</span><span>Last used {k.lastUsed}</span></div>
              </div>
            ))}
          </div>
        </div>
        {/* Sessions */}
        <div className="card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-2">💻 Active Sessions</h3>
          <p className="text-[10px] text-purple-400/40 italic mb-3">Real session management coming soon</p>
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.device} className="p-3 rounded-lg" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    <span className="text-xs font-semibold text-white">{s.device}</span>
                    {s.active && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400">CURRENT</span>}
                  </div>
                  {!s.active && <button onClick={() => handleComingSoon('Revoke Session')} className="text-xs text-red-400/60 hover:text-red-400">Revoke</button>}
                </div>
                <div className="text-xs text-purple-400/60">{s.browser} · {s.ip} · {s.location}</div>
                <div className="text-[10px] text-purple-400/40 mt-0.5">{s.time}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Audit Log */}
        <div className="col-span-2 card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-4">📋 Audit Log</h3>
          {auditLoading ? (
            <div className="flex items-center justify-center py-10 gap-3"><div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /><span className="text-xs text-purple-400/60 font-mono">Loading audit log…</span></div>
          ) : auditError ? (
            <div className="text-xs text-red-400/70 text-center py-8">❌ {auditError}</div>
          ) : auditEntries.length === 0 ? (
            <div className="text-xs text-purple-400/40 text-center py-8 italic">No audit entries found.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                  {["Time", "Action", "User ID", "Resource Type", "Details"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-purple-400/60 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
                    <td className="py-2.5 px-3 text-purple-400/60 whitespace-nowrap">{formatRelative(entry.createdAt)}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{entry.action}</td>
                    <td className="py-2.5 px-3 text-purple-300 font-mono text-[10px]">{entry.userId}</td>
                    <td className="py-2.5 px-3 text-purple-400/60">{entry.resourceType}</td>
                    <td className="py-2.5 px-3">
                      {entry.metadata ? (
                        <span className="font-mono text-[10px] text-purple-400/50 truncate max-w-[160px] block" title={JSON.stringify(entry.metadata)}>{JSON.stringify(entry.metadata)}</span>
                      ) : (
                        <span className="text-purple-400/30 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
