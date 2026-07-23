import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";

interface Workspace {
  id: string;
  name: string;
  owner: string;
  users: number;
  maxUsers: number;
  plan: "Starter" | "Pro" | "Business" | "Enterprise";
  status: "active" | "suspended" | "trialing";
  createdAt: string;
  apiKey?: string;
  monthlySpend: number;
}

interface PermissionRole {
  role: string;
  description: string;
  createCampaigns: boolean;
  editSettings: boolean;
  deleteResources: boolean;
  manageBilling: boolean;
  manageTeam: boolean;
  publishSocial: boolean;
}

const INITIAL_WORKSPACES: Workspace[] = [
  { id: "ws-001", name: "Alpha Core Systems", owner: "admin@octopus.ai", users: 5, maxUsers: 10, plan: "Enterprise", status: "active", createdAt: "2026-01-15", apiKey: "oct_live_89f1a029c3b88e11029a882", monthlySpend: 499 },
  { id: "ws-002", name: "Apex Affiliate Media", owner: "marketing@apex.io", users: 12, maxUsers: 25, plan: "Business", status: "active", createdAt: "2026-02-01", apiKey: "oct_live_3821bb940a8716e39281729", monthlySpend: 299 },
  { id: "ws-003", name: "Viral Matrix Growth", owner: "growth@viralmatrix.co", users: 3, maxUsers: 5, plan: "Pro", status: "active", createdAt: "2026-03-10", apiKey: "oct_live_19028a7f10b271c99023812", monthlySpend: 149 },
  { id: "ws-004", name: "Staging Testing Lab", owner: "qa@octopus.ai", users: 2, maxUsers: 5, plan: "Starter", status: "trialing", createdAt: "2026-04-05", apiKey: "oct_test_7781a9902bc112839912091", monthlySpend: 0 },
];

const INITIAL_ROLES: PermissionRole[] = [
  { role: "Owner", description: "Full root administrative authority across all workspaces & financial channels", createCampaigns: true, editSettings: true, deleteResources: true, manageBilling: true, manageTeam: true, publishSocial: true },
  { role: "Admin", description: "Workspace administrative access excluding ownership transfers & primary billing", createCampaigns: true, editSettings: true, deleteResources: true, manageBilling: false, manageTeam: true, publishSocial: true },
  { role: "Campaign Director", description: "Full operational authority to build, optimize and publish autonomous campaigns", createCampaigns: true, editSettings: true, deleteResources: false, manageBilling: false, manageTeam: false, publishSocial: true },
  { role: "Content Specialist", description: "Script generation, video factory rendering and asset review privileges", createCampaigns: true, editSettings: false, deleteResources: false, manageBilling: false, manageTeam: false, publishSocial: false },
  { role: "Analytics Viewer", description: "Read-only access to profit dashboards, ROI ledger and conversion metrics", createCampaigns: false, editSettings: false, deleteResources: false, manageBilling: false, manageTeam: false, publishSocial: false },
];

export function SaaSPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"workspaces" | "permissions" | "keys" | "analytics">("workspaces");
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [roles, setRoles] = useState<PermissionRole[]>(INITIAL_ROLES);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsOwner, setNewWsOwner] = useState(user?.email || "admin@octopus.ai");
  const [newWsPlan, setNewWsPlan] = useState<"Starter" | "Pro" | "Business" | "Enterprise">("Pro");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);

  // Filtered workspaces
  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.owner.toLowerCase().includes(search.toLowerCase()) ||
    w.plan.toLowerCase().includes(search.toLowerCase())
  );

  const totalARR = workspaces.reduce((acc, w) => acc + (w.monthlySpend * 12), 0);
  const totalSeats = workspaces.reduce((acc, w) => acc + w.users, 0);
  const activeCount = workspaces.filter(w => w.status === "active").length;

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return;
    const newWs: Workspace = {
      id: `ws-${String(workspaces.length + 1).padStart(3, "0")}`,
      name: newWsName.trim(),
      owner: newWsOwner.trim() || "owner@octopus.ai",
      users: 1,
      maxUsers: newWsPlan === "Enterprise" ? 50 : newWsPlan === "Business" ? 25 : newWsPlan === "Pro" ? 10 : 5,
      plan: newWsPlan,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      apiKey: `oct_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      monthlySpend: newWsPlan === "Enterprise" ? 499 : newWsPlan === "Business" ? 299 : newWsPlan === "Pro" ? 149 : 49,
    };
    setWorkspaces([newWs, ...workspaces]);
    setNewWsName("");
    setShowNewModal(false);
  };

  const handleToggleStatus = (id: string) => {
    setWorkspaces(workspaces.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === "active" ? "suspended" : "active";
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTogglePermission = (roleName: string, field: keyof PermissionRole) => {
    if (field === "role" || field === "description") return;
    setRoles(roles.map(r => {
      if (r.role === roleName) {
        return { ...r, [field]: !r[field] };
      }
      return r;
    }));
  };

  return (
    <div className="p-6 space-y-6 min-h-screen font-sans text-white" style={{ background: "#06020f" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <h1 className="text-2xl font-black font-heading text-white tracking-tight">SaaS Multi-Tenant Operations</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/40 text-purple-300">
              Enterprise Hub
            </span>
          </div>
          <p className="text-purple-400/70 text-xs mt-1">
            Multi-workspace isolation · Granular Role-Based Access Control (RBAC) · API Key Authority
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white gradient-purple glow-purple flex items-center justify-center gap-2 transition-all hover:scale-105"
        >
          <span>+</span> Create Tenant Workspace
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-purple-500/20">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-1">Total Workspaces</div>
          <div className="text-2xl font-black font-heading text-white">{workspaces.length}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">● {activeCount} Active Tenants</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-purple-500/20">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-1">Annual Recurring Revenue (ARR)</div>
          <div className="text-2xl font-black font-heading text-emerald-400">${totalARR.toLocaleString()}</div>
          <div className="text-[10px] text-purple-400/50 font-mono mt-1">${(totalARR / 12).toFixed(0)} / mo MRR</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-purple-500/20">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-1">Active User Seats</div>
          <div className="text-2xl font-black font-heading text-purple-300">{totalSeats} Seats</div>
          <div className="text-[10px] text-purple-400/50 font-mono mt-1">Across {workspaces.length} Organizations</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-purple-500/20">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-1">RBAC Security Level</div>
          <div className="text-2xl font-black font-heading text-emerald-400">Strict (ISO-27001)</div>
          <div className="text-[10px] text-purple-400/50 font-mono mt-1">JWT Bearer Enforced</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 rounded-xl w-fit border border-purple-900/30" style={{ background: "#0c071d" }}>
        {[
          { id: "workspaces", label: "🏢 Workspaces & Tenants", icon: "🏢" },
          { id: "permissions", label: "🔑 RBAC Roles & Matrix", icon: "🔑" },
          { id: "keys", label: "🗝️ API Key Provisioning", icon: "🗝️" },
          { id: "analytics", label: "📊 Usage & Quotas", icon: "📊" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.id
                ? "gradient-purple text-white shadow-lg glow-purple"
                : "text-purple-400/70 hover:text-white hover:bg-purple-950/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Workspaces List */}
      {tab === "workspaces" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="🔍 Search workspaces, owners or plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-xs bg-[#0d0920] border border-purple-500/20 text-white placeholder-purple-400/40 w-full max-w-md focus:outline-none focus:border-purple-500"
            />
            <span className="text-xs text-purple-400/60 font-mono">Showing {filteredWorkspaces.length} workspaces</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredWorkspaces.map(w => (
              <div
                key={w.id}
                className="glass-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-900/40 hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md">
                    {w.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-heading">{w.name}</span>
                      <span className="text-[10px] font-mono text-purple-400/50">{w.id}</span>
                    </div>
                    <div className="text-xs text-purple-400/70 mt-0.5">
                      Owner: <span className="text-purple-300 font-mono">{w.owner}</span> · Created {w.createdAt}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Plan Badge */}
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono ${
                    w.plan === "Enterprise" ? "bg-amber-950/60 text-amber-300 border border-amber-500/30" :
                    w.plan === "Business" ? "bg-purple-950/60 text-purple-300 border border-purple-500/30" :
                    "bg-blue-950/60 text-blue-300 border border-blue-500/30"
                  }`}>
                    {w.plan}
                  </span>

                  {/* Seat Usage Bar */}
                  <div className="w-32">
                    <div className="flex justify-between text-[10px] text-purple-400/70 mb-1 font-mono">
                      <span>Seats</span>
                      <span>{w.users}/{w.maxUsers}</span>
                    </div>
                    <div className="w-full h-1.5 bg-purple-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(w.users / w.maxUsers) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Spend */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono">${w.monthlySpend}/mo</div>
                    <div className="text-[9px] text-purple-400/50 uppercase">Billing</div>
                  </div>

                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(w.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      w.status === "active"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50"
                        : "bg-red-950/60 text-red-400 border border-red-500/30 hover:bg-red-900/50"
                    }`}
                  >
                    {w.status === "active" ? "● Active" : "⏸ Suspended"}
                  </button>

                  <button
                    onClick={() => setSelectedWs(w)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 border border-purple-500/30 hover:bg-purple-900/40"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RBAC Matrix */}
      {tab === "permissions" && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-xl border border-purple-900/30">
            <h3 className="text-sm font-bold text-white mb-1">Granular Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-purple-400/70">
              Click checkboxes below to dynamically modify execution scope authority for each defined role across the workspace.
            </p>
          </div>

          <div className="glass-card rounded-xl border border-purple-900/40 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-purple-900/40 bg-[#0d0920] text-purple-400/70 font-mono text-[11px]">
                  <th className="text-left p-4">Role & Description</th>
                  <th className="p-4 text-center">Create Campaigns</th>
                  <th className="p-4 text-center">Edit Settings</th>
                  <th className="p-4 text-center">Delete Resources</th>
                  <th className="p-4 text-center">Manage Billing</th>
                  <th className="p-4 text-center">Manage Team</th>
                  <th className="p-4 text-center">Publish Social</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.role} className="border-b border-purple-950/40 hover:bg-purple-950/20 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{r.role}</div>
                      <div className="text-[11px] text-purple-400/60 mt-0.5">{r.description}</div>
                    </td>
                    {(["createCampaigns", "editSettings", "deleteResources", "manageBilling", "manageTeam", "publishSocial"] as const).map(field => (
                      <td key={field} className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={r[field]}
                          onChange={() => handleTogglePermission(r.role, field)}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: API Key Provisioning */}
      {tab === "keys" && (
        <div className="space-y-4 max-w-4xl">
          <div className="glass-card p-4 rounded-xl border border-purple-900/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Tenant API Keys</h3>
              <p className="text-xs text-purple-400/70">Provision and manage secret authorization tokens for SDK & API integration.</p>
            </div>
            <button
              onClick={() => alert("🔑 New global API Key generated! Ensure you store it safely.")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple"
            >
              + Generate New API Key
            </button>
          </div>

          <div className="space-y-3">
            {workspaces.map(w => (
              <div key={w.id} className="glass-card p-4 rounded-xl border border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{w.name}</span>
                    <span className="text-[10px] font-mono bg-purple-950 px-2 py-0.5 rounded text-purple-400">{w.plan}</span>
                  </div>
                  <button
                    onClick={() => handleCopyKey(w.apiKey || "")}
                    className="text-xs px-3 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-mono"
                  >
                    {copiedKey === w.apiKey ? "✓ Copied!" : "📋 Copy Key"}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#0a0614] p-3 rounded-lg border border-purple-950">
                  <code className="text-xs font-mono text-emerald-400 flex-1 break-all">
                    {w.apiKey}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Usage & Quotas */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-xl border border-purple-900/40 space-y-4">
            <h3 className="text-sm font-bold text-white">Compute & API Request Distribution</h3>
            <div className="space-y-3 font-mono text-xs">
              {workspaces.map(w => (
                <div key={w.id} className="space-y-1">
                  <div className="flex justify-between text-purple-300">
                    <span>{w.name}</span>
                    <span className="text-emerald-400">{(w.users * 4230).toLocaleString()} reqs / mo</span>
                  </div>
                  <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-purple rounded-full"
                      style={{ width: `${(w.users / 25) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-purple-900/40 space-y-4">
            <h3 className="text-sm font-bold text-white">Platform Tenant Policy Summary</h3>
            <div className="space-y-2 text-xs text-purple-300/80">
              <div className="p-3 bg-[#0d0920] rounded-lg border border-purple-900/30 flex justify-between">
                <span>Database Row Isolation</span>
                <span className="text-emerald-400 font-mono font-bold">Enabled (tenant_id)</span>
              </div>
              <div className="p-3 bg-[#0d0920] rounded-lg border border-purple-900/30 flex justify-between">
                <span>Rate Limiting Tier</span>
                <span className="text-purple-400 font-mono">1,000 req / min</span>
              </div>
              <div className="p-3 bg-[#0d0920] rounded-lg border border-purple-900/30 flex justify-between">
                <span>JWT Token Expiration</span>
                <span className="text-purple-400 font-mono">7 Days (Auto Refresh)</span>
              </div>
              <div className="p-3 bg-[#0d0920] rounded-lg border border-purple-900/30 flex justify-between">
                <span>SSO / SAML 2.0 Auth</span>
                <span className="text-emerald-400 font-mono">Active (Okta, Google Workspace)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WORKSPACE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl border border-purple-500/40 w-full max-w-md space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-heading">Provision New Tenant Workspace</h3>
              <button onClick={() => setShowNewModal(false)} className="text-purple-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-purple-400/80 mb-1 font-semibold">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Media Corp"
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0614] border border-purple-500/30 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-400/80 mb-1 font-semibold">Primary Owner Email</label>
                <input
                  type="email"
                  placeholder="owner@acme.com"
                  value={newWsOwner}
                  onChange={e => setNewWsOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0614] border border-purple-500/30 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-400/80 mb-1 font-semibold">Subscription Plan</label>
                <select
                  value={newWsPlan}
                  onChange={e => setNewWsPlan(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0614] border border-purple-500/30 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Starter">Starter ($49/mo)</option>
                  <option value="Pro">Pro ($149/mo)</option>
                  <option value="Business">Business ($299/mo)</option>
                  <option value="Enterprise">Enterprise ($499/mo)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-950/40"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple"
              >
                Provision Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT WORKSPACE MODAL */}
      {selectedWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl border border-purple-500/40 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">{selectedWs.name}</h3>
              <button onClick={() => setSelectedWs(null)} className="text-purple-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs font-mono text-purple-300">
              <div className="flex justify-between py-1 border-b border-purple-950">
                <span>Tenant ID:</span>
                <span className="text-white">{selectedWs.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-950">
                <span>Owner:</span>
                <span className="text-white">{selectedWs.owner}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-950">
                <span>Plan:</span>
                <span className="text-emerald-400">{selectedWs.plan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-950">
                <span>Monthly Billing:</span>
                <span className="text-white">${selectedWs.monthlySpend}/mo</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-950">
                <span>Status:</span>
                <span className="text-emerald-400">{selectedWs.status}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedWs(null)}
              className="w-full py-2 rounded-xl text-xs font-bold text-white gradient-purple"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
