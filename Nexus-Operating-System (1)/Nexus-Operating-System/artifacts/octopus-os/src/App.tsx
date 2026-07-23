import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginPage } from "@/pages/LoginPage";
import { CommandCenter } from "@/pages/CommandCenter";
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

export type Page =
  | "command-center" | "agents" | "memory" | "prompt-studio"
  | "video-factory" | "workflow-builder" | "marketplace"
  | "providers" | "social" | "affiliates" | "integrations"
  | "analytics" | "campaigns"
  | "identity" | "billing" | "deployment" | "saas"
  | "security" | "settings";

function OS() {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState<Page>("command-center");

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0614" }}>
      <div className="text-center">
        <div className="text-5xl mb-4">🐙</div>
        <div className="text-purple-400 text-sm animate-pulse">OCTOPUS NEXUS OS v7</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (page) {
      case "command-center":    return <CommandCenter />;
      case "agents":            return <AgentsPage />;
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0614" }}>
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OS />
    </AuthProvider>
  );
}
