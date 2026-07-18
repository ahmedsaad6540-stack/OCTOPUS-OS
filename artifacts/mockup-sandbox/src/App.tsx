import { useEffect, useState, type ComponentType } from "react";
import { modules as discoveredModules } from "./.generated/mockup-components";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Sidebar, type Page } from "@/components/layout/Sidebar";
import { LoginPage } from "@/pages/LoginPage";
import { CommandCenter } from "@/pages/CommandCenter";
import { AgentsPage } from "@/pages/AgentsPage";
import { AIProvidersPage } from "@/pages/AIProvidersPage";
import { SocialPage } from "@/pages/SocialPage";
import { AffiliatePage } from "@/pages/AffiliatePage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { PromptStudioPage } from "@/pages/PromptStudioPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MemoryPage } from "@/pages/MemoryPage";
import { VideoFactoryPage } from "@/pages/VideoFactoryPage";
import { WorkflowBuilderPage } from "@/pages/WorkflowBuilderPage";
import { MarketplacePage } from "@/pages/MarketplacePage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { BillingPage } from "@/pages/BillingPage";
import { DeploymentPage } from "@/pages/DeploymentPage";
import { SaaSPage } from "@/pages/SaaSPage";
import { LegalPage } from "@/pages/LegalPage";
import { IdentityCenter } from "@/pages/IdentityCenter";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "@/pages/TermsOfServicePage";
import { LandingPage } from "@/pages/LandingPage";
import { DemoShowcasePage } from "@/pages/DemoShowcasePage";
import { YouTubeLoginPage } from "@/pages/YouTubeLoginPage";
import { YouTubeCallbackPage } from "@/pages/YouTubeCallbackPage";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }
      try {
        const mod = await loader();
        if (cancelled) return;
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(`No exported React component found in ${componentPath}.tsx`);
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();
    return () => { cancelled = true; };
  }, [componentPath, modules]);

  if (error) return <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>{error}</pre>;
  if (!Component) return null;
  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? match[1] : null;
}

function OctopusOS() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    return (localStorage.getItem("octopus_current_page") as Page) || "command-center";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0614] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🐙</div>
          <p className="text-purple-400 text-sm font-mono animate-pulse">Initializing OCTOPUS OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const pathname = window.location.pathname;
    if (pathname === "/login") {
      return <LoginPage />;
    }
    return <LandingPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "command-center":    return <CommandCenter />;
      case "agents":            return <AgentsPage />;
      case "memory":            return <MemoryPage />;
      case "prompt-studio":     return <PromptStudioPage />;
      case "video-factory":     return <VideoFactoryPage />;
      case "workflow-builder":  return <WorkflowBuilderPage />;
      case "marketplace":       return <MarketplacePage />;
      case "providers":         return <AIProvidersPage />;
      case "social":            return <SocialPage />;
      case "affiliates":        return <AffiliatePage />;
      case "integrations":      return <IntegrationsPage />;
      case "campaigns":         return <CampaignsPage />;
      case "analytics":         return <AnalyticsPage />;
      case "billing":           return <BillingPage />;
      case "deployment":        return <DeploymentPage />;
      case "saas":              return <SaaSPage />;
      case "legal":             return <LegalPage />;
      case "identity":          return <IdentityCenter />;
      case "settings":          return <SettingsPage />;
      default:                  return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0614] relative">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-25 flex items-center justify-between bg-[#0d0920] border-b border-purple-900/30 px-4 py-3 h-[53px]">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-purple-400 p-1 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">🐙</span>
          <span className="text-xs font-black text-white tracking-widest">OCTOPUS</span>
        </div>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        current={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          localStorage.setItem("octopus_current_page", page);
          setIsSidebarOpen(false); // Close drawer on link click on mobile
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area - shifts down on mobile to account for sticky top bar and padded bottom for mobile navbar */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden pt-[53px] pb-[68px] md:pt-0 md:pb-0">
        {renderPage()}
      </div>

      {/* Mobile Touch Bottom Navigation Bar (MVP & PWA) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[64px] bg-[#0d0920]/95 backdrop-blur-md border-t border-purple-900/40 flex items-center justify-around px-2 shadow-2xl shadow-purple-950/80">
        {[
          { id: "command-center", icon: "🖥️", label: "الرئيسية" },
          { id: "campaigns",      icon: "📣", label: "الحملات" },
          { id: "video-factory",  icon: "🎬", label: "فيديو AI" },
          { id: "agents",         icon: "🤖", label: "الوكلاء" },
          { id: "analytics",      icon: "📊", label: "الأرباح" },
        ].map((tab) => {
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentPage(tab.id as Page);
                localStorage.setItem("octopus_current_page", tab.id);
              }}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive
                  ? "text-white bg-purple-600/30 border border-purple-500/50 scale-105"
                  : "text-purple-400/70 hover:text-purple-300"
              }`}
            >
              <span className="text-lg leading-none mb-1">{tab.icon}</span>
              <span className="text-[10px] font-bold leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const previewPath = getPreviewPath();

  if (previewPath) {
    return (
      <PreviewRenderer
        componentPath={previewPath}
        modules={discoveredModules}
      />
    );
  }

  const pathname = window.location.pathname;
  if (pathname === "/privacy") {
    return <PrivacyPolicyPage />;
  }
  if (pathname === "/terms") {
    return <TermsOfServicePage />;
  }
  if (pathname === "/demo") {
    return <DemoShowcasePage />;
  }
  if (pathname === "/auth/youtube/login") {
    return <YouTubeLoginPage />;
  }
  if (pathname === "/auth/youtube/callback") {
    return <YouTubeCallbackPage />;
  }

  return (
    <AuthProvider>
      <OctopusOS />
    </AuthProvider>
  );
}

export default App;
