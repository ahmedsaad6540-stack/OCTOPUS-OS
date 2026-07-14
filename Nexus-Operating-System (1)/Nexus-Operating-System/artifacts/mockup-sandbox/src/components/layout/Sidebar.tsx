import { useAuth } from "@/lib/auth";

export type Page =
  | "command-center"
  | "agents"
  | "memory"
  | "prompt-studio"
  | "video-factory"
  | "workflow-builder"
  | "marketplace"
  | "providers"
  | "social"
  | "affiliates"
  | "integrations"
  | "campaigns"
  | "analytics"
  | "billing"
  | "deployment"
  | "saas"
  | "legal"
  | "identity"
  | "settings";

interface NavItem {
  id: Page;
  icon: string;
  label: string;
  badge?: string;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "command-center", icon: "🖥️", label: "Command Center", group: "OS Core" },
  { id: "agents",         icon: "🤖", label: "AI Agents",      badge: "10", group: "OS Core" },
  { id: "memory",         icon: "🧠", label: "Memory Engine",  group: "OS Core" },
  { id: "prompt-studio",  icon: "✍️", label: "Prompt Studio",  group: "OS Core" },

  { id: "video-factory",     icon: "🎬", label: "Video Factory",     group: "Creation" },
  { id: "workflow-builder",  icon: "🔄", label: "Workflow Builder",   group: "Creation" },
  { id: "marketplace",       icon: "🏪", label: "AI Marketplace",     group: "Creation" },

  { id: "providers",     icon: "🔮", label: "AI Providers",       group: "Connect" },
  { id: "social",        icon: "📱", label: "Social Accounts",    group: "Connect" },
  { id: "affiliates",    icon: "💰", label: "Affiliate Networks", group: "Connect" },
  { id: "integrations",  icon: "🔗", label: "Integrations Hub",   group: "Connect" },

  { id: "campaigns",  icon: "📣", label: "Campaigns",  group: "Business" },
  { id: "analytics",  icon: "📊", label: "Analytics",  group: "Business" },

  { id: "billing",     icon: "💳", label: "Billing",    group: "Platform" },
  { id: "deployment",  icon: "🚀", label: "Deployment", group: "Platform" },
  { id: "saas",        icon: "🏢", label: "SaaS Mode",  group: "Platform" },
  { id: "identity",    icon: "🏛️", label: "Identity Center", group: "Platform" },
  { id: "legal",       icon: "⚖️", label: "Legal Pages", group: "Platform" },

  { id: "settings", icon: "⚙️", label: "Settings", group: "System" },
];

const GROUPS = ["OS Core", "Creation", "Connect", "Business", "Platform", "System"];

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ current, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 min-h-screen bg-[#0d0920] border-r border-purple-900/30 flex flex-col">
      <div className="px-4 py-4 border-b border-purple-900/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-lg shadow-lg shadow-purple-900/50">
            🐙
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight leading-none">OCTOPUS</p>
            <p className="text-[10px] text-purple-500 font-mono">NEXUS OS v6</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((n) => n.group === group);
          return (
            <div key={group} className="mb-3">
              <p className="text-[9px] font-bold text-purple-800 uppercase tracking-widest px-2 mb-1">
                {group}
              </p>
              {items.map((item) => {
                const active = current === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 text-xs transition-all text-left ${
                      active
                        ? "bg-gradient-to-r from-purple-800/60 to-indigo-800/40 text-white border border-purple-700/40 shadow-sm"
                        : "text-purple-400 hover:bg-purple-900/30 hover:text-white border border-transparent"
                    }`}
                  >
                    <span className="text-sm w-4 text-center flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] bg-purple-800/60 text-purple-300 px-1.5 py-0.5 rounded-full font-mono flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#a855f7] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="border-t border-purple-900/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[9px] text-purple-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-[10px] text-purple-600 hover:text-red-400 py-1.5 px-2 rounded-lg border border-purple-900/30 hover:border-red-900/40 transition-all text-left"
        >
          ← Logout
        </button>
      </div>
    </aside>
  );
}
