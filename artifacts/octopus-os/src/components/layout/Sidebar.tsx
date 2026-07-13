import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Page } from "@/App";

interface NavItem { id: Page; icon: string; labelKey: string; groupKey: string; }

const NAV: NavItem[] = [
  { id: "command-center",   icon: "🖥️",  labelKey: "homeWorkspace",    groupKey: "osCore" },
  { id: "agents",           icon: "🤖",  labelKey: "aiAgents",         groupKey: "osCore" },
  { id: "workforce",        icon: "👥",  labelKey: "aiWorkforce",      groupKey: "osCore" },
  { id: "memory",           icon: "🧠",  labelKey: "memoryEngine",     groupKey: "osCore" },
  { id: "prompt-studio",    icon: "✍️",  labelKey: "promptStudio",     groupKey: "osCore" },

  { id: "video-factory",     icon: "🎬",  labelKey: "videoFactory",     groupKey: "creation" },
  { id: "workflow-builder",  icon: "⚙️",  labelKey: "workflowBuilder",  groupKey: "creation" },
  { id: "marketplace",       icon: "🌐",  labelKey: "aiMarketplace",    groupKey: "creation" },

  { id: "providers",        icon: "🔮",  labelKey: "aiProviders",      groupKey: "connectGroup" },
  { id: "social",           icon: "📱",  labelKey: "socialHub",        groupKey: "connectGroup" },
  { id: "affiliates",       icon: "💰",  labelKey: "affiliateHub",     groupKey: "connectGroup" },
  { id: "integrations",     icon: "🔗",  labelKey: "integrations",     groupKey: "connectGroup" },

  { id: "analytics",        icon: "📊",  labelKey: "analytics",        groupKey: "business" },
  { id: "campaigns",        icon: "📢",  labelKey: "campaigns",        groupKey: "business" },

  { id: "identity",         icon: "🏛️",  labelKey: "identityCenter",   groupKey: "platform" },
  { id: "billing",          icon: "💳",  labelKey: "billing",          groupKey: "platform" },
  { id: "deployment",       icon: "🚀",  labelKey: "deployment",       groupKey: "platform" },
  { id: "saas",             icon: "🏢",  labelKey: "saasMode",         groupKey: "platform" },

  { id: "security",         icon: "🔒",  labelKey: "securityCenter",   groupKey: "system" },
  { id: "settings",         icon: "⚙️",  labelKey: "settings",         groupKey: "system" },
];

const GROUPS = ["osCore", "creation", "connectGroup", "business", "platform", "system"];

interface Props { currentPage: Page; onNavigate: (p: Page) => void; }

export function Sidebar({ currentPage, onNavigate }: Props) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="flex flex-col h-screen transition-all duration-300 shrink-0 select-none z-10 glass"
      style={{ width: collapsed ? 68 : 240, borderRight: "1px solid rgba(139,92,246,0.15)" }}>

      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        {!collapsed && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🐙</span>
              <span className="font-extrabold text-sm tracking-tight text-white font-heading">
                OCTOPUS
              </span>
            </div>
            <div className="text-[9px] text-purple-400 font-mono tracking-widest pl-8">NEXUS OS v7</div>
          </div>
        )}
        {collapsed && <span className="text-2xl mx-auto animate-pulse">🐙</span>}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 ml-auto transition-all">
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Language Switcher in Sidebar (English/العربية toggle) */}
      {!collapsed && (
        <div className="px-4 py-2 flex justify-between items-center gap-2 border-b border-purple-950/40">
          <span className="text-[10px] text-purple-400/50 uppercase tracking-wider font-mono">Lang / لغة</span>
          <div className="flex gap-1.5">
            <button onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                language === "en" ? "bg-purple-600 text-white shadow-sm" : "text-purple-400 hover:text-purple-200"
              }`}>
              EN
            </button>
            <button onClick={() => setLanguage("ar")}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                language === "ar" ? "bg-purple-600 text-white shadow-sm" : "text-purple-400 hover:text-purple-200"
              }`}>
              عربي
            </button>
          </div>
        </div>
      )}

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {GROUPS.map(groupKey => {
          const items = NAV.filter(n => n.groupKey === groupKey);
          return (
            <div key={groupKey} className="space-y-1">
              {!collapsed && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/40 px-3 py-1.5 font-heading">
                  {t(groupKey)}
                </div>
              )}
              {items.map(item => {
                const isActive = currentPage === item.id;
                return (
                  <button key={item.id} onClick={() => onNavigate(item.id)}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 group relative ${
                      isActive
                        ? "gradient-purple text-white shadow-md glow-purple font-bold"
                        : "text-purple-300/70 hover:bg-purple-950/20 hover:text-purple-200"
                    }`}>
                    <span className={`text-base shrink-0 transition-transform group-hover:scale-110 ${isActive ? "scale-110" : ""}`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                    
                    {/* Active side indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User profile info block */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-3 glass-card bg-purple-950/10 border border-purple-500/10">
            <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner glow-purple">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate font-heading">{user?.name || "Ahmed Saad"}</div>
              <div className="text-[9px] text-purple-400/60 font-mono uppercase tracking-wide truncate">{t("admin")}</div>
            </div>
          </div>
        )}
        <button onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all ${collapsed ? "justify-center" : ""}`}>
          <span className="text-base shrink-0">🚪</span>
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
