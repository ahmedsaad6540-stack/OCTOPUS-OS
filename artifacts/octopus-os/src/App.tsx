import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginPage } from "@/pages/LoginPage";
import { LandingPage } from "@/pages/LandingPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "@/pages/TermsOfServicePage";
import { DemoShowcasePage } from "@/pages/DemoShowcasePage";
import { CommandCenter } from "@/pages/CommandCenter";
import { MissionControlPage } from "@/pages/MissionControlPage";
import { WorkforcePage } from "@/pages/WorkforcePage";
import { ChatPage } from "@/pages/ChatPage";
import { AgentsPage } from "@/pages/AgentsPage";
import { AIProvidersPage } from "@/pages/AIProvidersPage";
import { SocialPage } from "@/pages/SocialPage";
import { AffiliatesPage } from "@/pages/AffiliatesPage";
import { IdentityCenter } from "@/pages/IdentityCenter";
import { VideoFactoryPage } from "@/pages/VideoFactoryPage";
import { PromptStudioPage } from "@/pages/PromptStudioPage";
import { WorkflowBuilderPage } from "@/pages/WorkflowBuilderPage";
import { MarketplacePage } from "@/pages/MarketplacePage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { MemoryPage } from "@/pages/MemoryPage";
import { SecurityPage } from "@/pages/SecurityPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { BillingPage } from "@/pages/BillingPage";
import { DeploymentPage } from "@/pages/DeploymentPage";
import { SaaSPage } from "@/pages/SaaSPage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";

export type Page =
  | "command-center" | "agents" | "workforce" | "memory" | "prompt-studio"
  | "video-factory" | "workflow-builder" | "marketplace"
  | "providers" | "social" | "affiliates" | "integrations"
  | "analytics" | "campaigns"
  | "identity" | "billing" | "deployment" | "saas"
  | "security" | "settings";

function OS() {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState<Page>("command-center");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06020f]">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🐙</div>
        <div className="text-purple-400 font-mono text-sm tracking-widest animate-pulse">OCTOPUS NEXUS OS v7</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (page) {
      case "command-center":    return <CommandCenter />;
      case "agents":            return <AgentsPage />;
      case "workforce":         return <WorkforcePage />;
      case "memory":            return <MemoryPage />;
      case "prompt-studio":     return <PromptStudioPage />;
      case "video-factory":     return <VideoFactoryPage />;
      case "workflow-builder":  return <WorkflowBuilderPage />;
      case "marketplace":       return <MarketplacePage />;
      case "providers":         return <AIProvidersPage />;
      case "social":            return <SocialPage />;
      case "affiliates":        return <AffiliatesPage />;
      case "integrations":      return <IntegrationsPage />;
      case "analytics":         return <AnalyticsPage />;
      case "campaigns":         return <CampaignsPage />;
      case "identity":          return <IdentityCenter />;
      case "billing":           return <BillingPage />;
      case "deployment":        return <DeploymentPage />;
      case "saas":              return <SaaSPage />;
      case "security":          return <SecurityPage />;
      case "settings":          return <SettingsPage />;
      default:                  return <CommandCenter />;
    }
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-[#06020f] text-[#e2d9f3]">
        <button onClick={() => setMobileOpen(true)} className="text-2xl">☰</button>
        <span className="font-bold text-sm">OCTOPUS</span>
      </div>

      <div className="flex h-screen overflow-hidden bg-[#06020f] text-[#e2d9f3]">
        <div className={`fixed inset-y-0 left-0 z-20 ${mobileOpen ? "block" : "hidden"} md:block`}>
          <Sidebar
            currentPage={page}
            onNavigate={p => {
              setPage(p);
              setMobileOpen(false);
            }}
          />
        </div>
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Switch>
          {/* Public landing, demo, legal pages — visible WITHOUT login */}
          <Route path="/" component={LandingPage} />
          <Route path="/demo" component={DemoShowcasePage} />
          <Route path="/privacy" component={PrivacyPolicyPage} />
          <Route path="/terms" component={TermsOfServicePage} />
          {/* Login + full OS — all /login and everything else */}
          <Route path="/login" component={() => <OS />} />
          <Route component={() => <OS />} />
        </Switch>
      </AuthProvider>
    </LanguageProvider>
  );
}
