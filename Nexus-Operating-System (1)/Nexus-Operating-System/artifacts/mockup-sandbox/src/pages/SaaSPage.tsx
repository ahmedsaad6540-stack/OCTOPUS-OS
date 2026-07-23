import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface Workspace {
  id: string;
  name: string;
  owner: string;
  plan: string;
  members: number;
  campaigns: number;
  revenue: string;
  status: "active" | "trial" | "suspended";
  createdAt: string;
}

const SAMPLE_WORKSPACES: Workspace[] = [
  { id: "1", name: "Ahmed's Studio", owner: "admin@octopus.ai", plan: "Pro", members: 3, campaigns: 12, revenue: "$2,340", status: "active", createdAt: "Jan 15, 2025" },
  { id: "2", name: "Digital Nomads Agency", owner: "agency@example.com", plan: "Business", members: 8, campaigns: 45, revenue: "$18,920", status: "active", createdAt: "Feb 3, 2025" },
  { id: "3", name: "Solo Affiliate", owner: "solo@gmail.com", plan: "Starter", members: 1, campaigns: 3, revenue: "$240", status: "trial", createdAt: "Jun 20, 2025" },
];

const STATUS_CONFIG = {
  active: { color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/30" },
  trial: { color: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/30" },
  suspended: { color: "text-red-400", bg: "bg-red-900/20 border-red-800/30" },
};

export function SaaSPage() {
  const { user } = useAuth();
  const [workspaces] = useState(SAMPLE_WORKSPACES);
  const [tab, setTab] = useState<"workspaces" | "permissions" | "api-keys" | "overview">("overview");

  const totalRevenue = workspaces.reduce((s) => s + Math.random() * 1000, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🏢 SaaS Management</h1>
            <p className="text-purple-400 text-sm mt-1">
              Manage workspaces, permissions, and subscriptions · {workspaces.length} workspaces
            </p>
          </div>
          <button className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
            + New Workspace
          </button>
        </div>

        <div className="flex gap-1 bg-[#130d2a] border border-purple-900/40 rounded-xl p-1 mb-6 w-fit">
          {([
            { id: "overview", label: "📊 Overview" },
            { id: "workspaces", label: "🏢 Workspaces" },
            { id: "permissions", label: "🔐 Permissions" },
            { id: "api-keys", label: "🔑 API Keys" },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === id ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow" : "text-purple-500 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Workspaces", value: workspaces.length, icon: "🏢", color: "from-purple-900/30 to-indigo-900/20" },
                { label: "Active Users", value: workspaces.reduce((s, w) => s + w.members, 0), icon: "👥", color: "from-blue-900/30 to-cyan-900/20" },
                { label: "Total Campaigns", value: workspaces.reduce((s, w) => s + w.campaigns, 0), icon: "📣", color: "from-emerald-900/30 to-teal-900/20" },
                { label: "MRR", value: "$2,450", icon: "💰", color: "from-amber-900/30 to-orange-900/20" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className={`bg-gradient-to-br ${color} border border-purple-900/40 rounded-xl p-4`}>
                  <p className="text-2xl mb-2">{icon}</p>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-purple-300 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">📦 What Each Workspace Gets</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: "🧠", label: "AI Agents", desc: "All 10 agents isolated" },
                  { icon: "🗄️", label: "Database", desc: "Separate PostgreSQL" },
                  { icon: "🔑", label: "API Keys", desc: "Own provider keys" },
                  { icon: "📱", label: "Social Accounts", desc: "Platform connections" },
                  { icon: "💰", label: "Affiliate Networks", desc: "Network integrations" },
                  { icon: "👥", label: "Team Members", desc: "Role-based access" },
                  { icon: "💳", label: "Billing", desc: "Separate invoicing" },
                  { icon: "📊", label: "Analytics", desc: "Isolated dashboards" },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="bg-[#0d0920] rounded-xl p-3 border border-purple-900/20 text-center">
                    <p className="text-xl mb-1">{icon}</p>
                    <p className="text-xs font-bold text-white">{label}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "workspaces" && (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-purple-900/40">
                  {["Workspace", "Owner", "Plan", "Members", "Campaigns", "Revenue", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-purple-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workspaces.map((ws) => {
                  const s = STATUS_CONFIG[ws.status];
                  return (
                    <tr key={ws.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{ws.name}</p>
                        <p className="text-[10px] text-purple-600">Created {ws.createdAt}</p>
                      </td>
                      <td className="px-4 py-3 text-purple-300">{ws.owner}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-800/40 text-purple-300 px-2 py-0.5 rounded font-mono text-[10px]">{ws.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-purple-300">{ws.members}</td>
                      <td className="px-4 py-3 text-purple-300">{ws.campaigns}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{ws.revenue}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${s.bg} ${s.color}`}>{ws.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="text-[10px] text-purple-400 hover:text-white bg-purple-900/20 px-2 py-1 rounded border border-purple-800/30 transition-all">View</button>
                          <button className="text-[10px] text-red-400 bg-red-900/10 px-2 py-1 rounded border border-red-900/20 transition-all">Suspend</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "permissions" && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-white mb-4">🔐 Role Permissions Matrix</h3>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-purple-900/40">
                    <th className="text-left px-4 py-3 text-purple-500 font-semibold">Permission</th>
                    {["Admin", "Editor", "Viewer"].map((role) => (
                      <th key={role} className="text-center px-4 py-3 text-purple-500 font-semibold">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { perm: "View Dashboard", admin: true, editor: true, viewer: true },
                    { perm: "Create Campaigns", admin: true, editor: true, viewer: false },
                    { perm: "Run AI Agents", admin: true, editor: true, viewer: false },
                    { perm: "Manage Providers", admin: true, editor: false, viewer: false },
                    { perm: "Manage Social Accounts", admin: true, editor: true, viewer: false },
                    { perm: "View Analytics", admin: true, editor: true, viewer: true },
                    { perm: "Manage Team", admin: true, editor: false, viewer: false },
                    { perm: "Billing Access", admin: true, editor: false, viewer: false },
                    { perm: "Export Data", admin: true, editor: true, viewer: false },
                    { perm: "Delete Data", admin: true, editor: false, viewer: false },
                  ].map(({ perm, admin, editor, viewer }) => (
                    <tr key={perm} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                      <td className="px-4 py-2.5 text-purple-200">{perm}</td>
                      {[admin, editor, viewer].map((allowed, i) => (
                        <td key={i} className="px-4 py-2.5 text-center">
                          <span className={`text-sm ${allowed ? "text-emerald-400" : "text-gray-700"}`}>
                            {allowed ? "✓" : "✕"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "api-keys" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">🔑 API Keys</h3>
              <button className="text-xs bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold px-4 py-2 rounded-xl">+ Generate Key</button>
            </div>
            <div className="space-y-3">
              {[
                { name: "Production API Key", key: "oct_live_k2x9p...7mQa", created: "Jun 1, 2025", lastUsed: "2 min ago", scope: "Full Access" },
                { name: "Read-Only Key", key: "oct_read_m5n8r...3kPz", created: "May 15, 2025", lastUsed: "1 day ago", scope: "Read Only" },
                { name: "Webhook Key", key: "oct_whk_q7t2s...9nBx", created: "Apr 20, 2025", lastUsed: "5 hours ago", scope: "Webhooks" },
              ].map((k) => (
                <div key={k.name} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-white">{k.name}</p>
                      <span className="text-[9px] bg-purple-800/40 text-purple-300 px-1.5 py-0.5 rounded font-mono">{k.scope}</span>
                    </div>
                    <button className="text-[10px] text-red-400 bg-red-900/10 px-2 py-1 rounded border border-red-900/20 hover:border-red-700 transition-all">Revoke</button>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0d0920] rounded-lg px-3 py-2 border border-purple-900/20">
                    <p className="text-xs font-mono text-purple-300 flex-1">{k.key}</p>
                    <button className="text-[10px] text-purple-400 hover:text-white transition-all">Copy</button>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <p className="text-[10px] text-purple-700">Created: {k.created}</p>
                    <p className="text-[10px] text-purple-700">Last used: {k.lastUsed}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
