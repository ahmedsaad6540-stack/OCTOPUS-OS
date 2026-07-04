import { useState } from "react";

const AUDIT_LOG = [
  { time: "2 min ago", event: "Login", user: "admin@octopus.ai", ip: "192.168.1.1", status: "success" },
  { time: "15 min ago", event: "AI Provider saved", user: "admin@octopus.ai", ip: "192.168.1.1", status: "success" },
  { time: "1 hr ago", event: "Campaign created", user: "admin@octopus.ai", ip: "192.168.1.1", status: "success" },
  { time: "2 hr ago", event: "API Key generated", user: "admin@octopus.ai", ip: "192.168.1.1", status: "success" },
  { time: "3 hr ago", event: "Failed login attempt", user: "unknown@test.com", ip: "185.23.44.12", status: "failed" },
];

const API_KEYS = [
  { name: "Main API Key", key: "oct_live_••••••••••••••••••••••••••••••••", created: "2026-06-01", lastUsed: "2 min ago" },
  { name: "Webhook Key", key: "oct_wh_••••••••••••••••••••••••••••••••", created: "2026-06-10", lastUsed: "1 hr ago" },
];

export function SecurityPage() {
  const [sessions] = useState([
    { device: "MacBook Pro", browser: "Chrome 126", ip: "192.168.1.1", location: "Riyadh, SA", active: true, time: "Now" },
    { device: "iPhone 15", browser: "Safari 17", ip: "192.168.1.2", location: "Riyadh, SA", active: false, time: "2 hr ago" },
  ]);

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🔐 Security Center</h1>
        <p className="text-purple-400/60 text-xs mt-1">API Keys · Sessions · Audit Log · Vault</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* API Keys */}
        <div className="card-os p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-purple-300">🔑 API Keys</h3>
            <button className="px-3 py-1.5 rounded-lg text-xs text-white gradient-purple">+ Generate</button>
          </div>
          <div className="space-y-3">
            {API_KEYS.map(k => (
              <div key={k.name} className="p-3 rounded-lg" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{k.name}</span>
                  <button className="text-red-400/60 hover:text-red-400 text-xs">Revoke</button>
                </div>
                <div className="font-mono text-xs text-purple-400/60 mb-2">{k.key}</div>
                <div className="flex justify-between text-[10px] text-purple-400/40">
                  <span>Created {k.created}</span>
                  <span>Last used {k.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-4">💻 Active Sessions</h3>
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.device} className="p-3 rounded-lg" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.active ? "bg-emerald-400" : "bg-gray-600"}`}></span>
                    <span className="text-xs font-semibold text-white">{s.device}</span>
                    {s.active && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400">CURRENT</span>}
                  </div>
                  {!s.active && <button className="text-xs text-red-400/60 hover:text-red-400">Revoke</button>}
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
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                {["Time", "Event", "User", "IP Address", "Status"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-purple-400/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
                  <td className="py-2.5 px-3 text-purple-400/60">{l.time}</td>
                  <td className="py-2.5 px-3 text-white font-medium">{l.event}</td>
                  <td className="py-2.5 px-3 text-purple-300">{l.user}</td>
                  <td className="py-2.5 px-3 font-mono text-purple-400/60">{l.ip}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === "success" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
                      {l.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
