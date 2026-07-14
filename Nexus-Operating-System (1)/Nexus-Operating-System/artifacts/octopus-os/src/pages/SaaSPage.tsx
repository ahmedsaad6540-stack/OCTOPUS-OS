import { useState } from "react";

const WORKSPACES = [
  { id: 1, name: "Workspace Alpha", owner: "admin@octopus.ai", users: 3, plan: "Pro", status: "active" },
  { id: 2, name: "Client Beta Corp", owner: "beta@client.com", users: 7, plan: "Business", status: "active" },
  { id: 3, name: "Test Environment", owner: "test@octopus.ai", users: 1, plan: "Starter", status: "inactive" },
];

const PERMISSIONS = [
  { role: "Owner",  create: true,  edit: true,  del: true,  billing: true,  users: true },
  { role: "Admin",  create: true,  edit: true,  del: true,  billing: false, users: true },
  { role: "Editor", create: true,  edit: true,  del: false, billing: false, users: false },
  { role: "Viewer", create: false, edit: false, del: false, billing: false, users: false },
];

export function SaaSPage() {
  const [tab, setTab] = useState<"workspaces"|"permissions"|"keys">("workspaces");

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🏢 SaaS Mode</h1>
        <p className="text-purple-400/60 text-xs mt-1">Multi-workspace · Role-based access · Client management</p>
      </div>
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background:"#0d0920" }}>
        {(["workspaces","permissions","keys"] as const).map(id => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${tab === id ? "gradient-purple text-white" : "text-purple-400"}`}>
            {id === "workspaces" ? "🏢 Workspaces" : id === "permissions" ? "🔑 Permissions" : "🗝️ API Keys"}
          </button>
        ))}
      </div>

      {tab === "workspaces" && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">+ New Workspace</button>
          </div>
          <div className="space-y-3">
            {WORKSPACES.map(w => (
              <div key={w.id} className="card-os p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center text-lg font-bold text-white">{w.name[0]}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{w.name}</div>
                    <div className="text-xs text-purple-400/60">{w.owner} · {w.users} users</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(139,92,246,0.1)", color:"#a78bfa" }}>{w.plan}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "active" ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>{w.status}</span>
                  <button className="px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30">Manage</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "permissions" && (
        <div className="card-os overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(139,92,246,0.15)" }}>
                {["Role","Create","Edit","Delete","Billing","Manage Users"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-purple-400/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(r => (
                <tr key={r.role} style={{ borderBottom:"1px solid rgba(139,92,246,0.06)" }}>
                  <td className="px-5 py-3 font-bold text-white">{r.role}</td>
                  {[r.create, r.edit, r.del, r.billing, r.users].map((v, i) => (
                    <td key={i} className="px-5 py-3">
                      <span className={`text-sm ${v ? "text-emerald-400" : "text-gray-700"}`}>{v ? "✓" : "✗"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "keys" && (
        <div className="max-w-xl">
          <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple mb-4">+ Generate API Key</button>
          <div className="space-y-3">
            {WORKSPACES.map(w => (
              <div key={w.id} className="card-os p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{w.name}</span>
                  <button className="text-xs text-red-400/60 hover:text-red-400">Revoke</button>
                </div>
                <div className="font-mono text-xs text-purple-400/60">oct_ws_{w.id}_••••••••••••••••••••••••••••••••</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
