import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Page } from "@/App";

interface NavItem { id: Page; icon: string; label: string; group: string; }

const NAV: NavItem[] = [
  { id: "command-center",   icon: "🖥️",  label: "Command Center",    group: "OS Core" },
  { id: "agents",           icon: "🤖",  label: "AI Agents",          group: "OS Core" },
  { id: "memory",           icon: "🧠",  label: "Memory Engine",      group: "OS Core" },
  { id: "prompt-studio",    icon: "✍️",  label: "Prompt Studio",      group: "OS Core" },

  { id: "video-factory",    icon: "🎬",  label: "Video Factory",      group: "Creation" },
  { id: "workflow-builder", icon: "🔄",  label: "Workflow Builder",   group: "Creation" },
  { id: "marketplace",      icon: "🏪",  label: "AI Marketplace",     group: "Creation" },

  { id: "providers",        icon: "🔮",  label: "AI Providers",       group: "Connect" },
  { id: "social",           icon: "📱",  label: "Social Hub",         group: "Connect" },
  { id: "affiliates",       icon: "💰",  label: "Affiliate Hub",      group: "Connect" },
  { id: "integrations",     icon: "🔗",  label: "Integrations",       group: "Connect" },

  { id: "analytics",        icon: "📊",  label: "Analytics",          group: "Business" },
  { id: "campaigns",        icon: "📣",  label: "Campaigns",          group: "Business" },

  { id: "identity",         icon: "🏛️", label: "Identity Center",    group: "Platform" },
  { id: "billing",          icon: "💳",  label: "Billing",            group: "Platform" },
  { id: "deployment",       icon: "🚀",  label: "Deployment",         group: "Platform" },
  { id: "saas",             icon: "🏢",  label: "SaaS Mode",          group: "Platform" },

  { id: "security",         icon: "🔐",  label: "Security Center",    group: "System" },
  { id: "settings",         icon: "⚙️",  label: "Settings",           group: "System" },
];

const GROUPS = ["OS Core", "Creation", "Connect", "Business", "Platform", "System"];

interface Props { currentPage: Page; onNavigate: (p: Page) => void; }

export function Sidebar({ currentPage, onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="flex flex-col h-screen transition-all duration-300 shrink-0"
      style={{ width: collapsed ? 60 : 220, background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>

      <div className="flex items-center justify-between px-3 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        {!collapsed && (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐙</span>
              <span className="font-bold text-sm"><span className="text-white">OCT</span><span className="text-purple-400">OPUS</span></span>
            </div>
            <div className="text-[9px] text-purple-500/60 tracking-widest pl-8">NEXUS OS v7</div>
          </div>
        )}
        {collapsed && <span className="text-xl mx-auto">🐙</span>}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-purple-400 hover:text-purple-300 text-xs ml-auto transition-colors">
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {GROUPS.map(group => {
          const items = NAV.filter(n => n.group === group);
          return (
            <div key={group} className="mb-3">
              {!collapsed && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50 px-2 py-1 mb-1">
                  {group}
                </div>
              )}
              {items.map(item => (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all mb-0.5 ${
                    currentPage === item.id
                      ? "gradient-purple text-white shadow-md"
                      : "text-purple-300/70 hover:bg-purple-900/30 hover:text-purple-200"
                  }`}>
                  <span className="text-sm shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="px-2 py-3" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg mb-2" style={{ background: "rgba(139,92,246,0.1)" }}>
            <div className="w-7 h-7 rounded-full gradient-purple flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</div>
              <div className="text-[9px] text-purple-400/60 truncate">{user?.role || "owner"}</div>
            </div>
          </div>
        )}
        <button onClick={logout}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-900/20 transition-all ${collapsed ? "justify-center" : ""}`}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
