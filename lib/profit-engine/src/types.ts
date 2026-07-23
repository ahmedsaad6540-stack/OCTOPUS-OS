import type { 
  opportunitiesTable, 
  landingPagesTable, 
  funnelsTable, 
  marketingContentTable, 
  videoJobsTable, 
  competitorInsightsTable, 
  profitMemoryTable,
  knowledgeGraphTable,
  longTermMemoryTable,
  strategicGoalsTable,
  proposalsTable
} from "@workspace/db/schema";

export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type InsertOpportunity = typeof opportunitiesTable.$inferInsert;

export type LandingPage = typeof landingPagesTable.$inferSelect;
export type InsertLandingPage = typeof landingPagesTable.$inferInsert;

export type Funnel = typeof funnelsTable.$inferSelect;
export type InsertFunnel = typeof funnelsTable.$inferInsert;

export type MarketingContent = typeof marketingContentTable.$inferSelect;
export type InsertMarketingContent = typeof marketingContentTable.$inferInsert;

export type VideoJob = typeof videoJobsTable.$inferSelect;
export type InsertVideoJob = typeof videoJobsTable.$inferInsert;

export type CompetitorInsight = typeof competitorInsightsTable.$inferSelect;
export type InsertCompetitorInsight = typeof competitorInsightsTable.$inferInsert;

export type ProfitMemoryEntry = typeof profitMemoryTable.$inferSelect;
export type InsertProfitMemoryEntry = typeof profitMemoryTable.$inferInsert;

export type KnowledgeGraphTriple = typeof knowledgeGraphTable.$inferSelect;
export type InsertKnowledgeGraphTriple = typeof knowledgeGraphTable.$inferInsert;

export type LongTermMemoryEntry = typeof longTermMemoryTable.$inferSelect;
export type InsertLongTermMemoryEntry = typeof longTermMemoryTable.$inferInsert;

export type StrategicGoal = typeof strategicGoalsTable.$inferSelect;
export type InsertStrategicGoal = typeof strategicGoalsTable.$inferInsert;

export type Proposal = typeof proposalsTable.$inferSelect;
export type InsertProposal = typeof proposalsTable.$inferInsert;

// Operating Modes for Human Approval Layer
export type ApprovalMode = "AUTO" | "SEMI_AUTO" | "MANUAL" | "LEARNING";

export interface SystemModeSettings {
  mode: ApprovalMode;
}

// Money Dashboard Telemetry Metrics
export interface DashboardStats {
  hourlyRevenue: { hour: string; revenue: number }[];
  dailyRevenue: { date: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  roi: number;
  epc: number;
  conversionRate: number;
  bestProducts: { productName: string; revenue: number; conversions: number }[];
  bestTrafficSources: { source: string; revenue: number }[];
  bestCountries: { country: string; revenue: number }[];
  bestPlatforms: { platform: string; revenue: number }[];
  revenueForecasts: { date: string; predictedRevenue: number }[];
  trendAnalysis: { topic: string; platform: string; score: number; isViral: boolean }[];
  aiRecommendations: string[];
  activeMilestone: StrategicGoal | null;
  pendingProposals: Proposal[];
}

// Provider-Adapter Contract for Affiliate Networks
export interface AffiliateProduct {
  name: string;
  affiliateNetwork: string;
  commissionRate: number;
  epc: number;
  productUrl: string;
  niche: string;
  description?: string;
}

export interface AffiliateNetworkAdapter {
  name: string;
  fetchProducts(niche: string): Promise<AffiliateProduct[]>;
}

// Logger Interface
export interface ProfitEngineLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

// Inter-module decoupling signatures (Brain, Scheduler, AgentManager, ToolManager, WorkflowEngine)
export interface EventPublisher {
  publish<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: { correlationId?: string; causationId?: string; userId?: string }
  ): Promise<unknown>;
}

export interface RuleRegistrar {
  registerRule(rule: {
    name: string;
    pattern: string;
    priority?: number;
    evaluate(event: any): any;
  }): () => void;
}

export interface AgentRegistrar {
  create(input: {
    name: string;
    description?: string;
    instructions: string;
    capabilities?: string[];
    status?: "active" | "disabled";
    userId?: string;
  }): Promise<{ id: string }>;
  list(query?: { limit?: number }): Promise<{ id: string; name: string }[]>;
}

export interface ToolRegistrar {
  create(input: {
    name: string;
    description?: string;
    inputSchema: any;
    handlerName: string;
    status?: "active" | "disabled";
  }): Promise<{ id: string }>;
  registerHandler(handlerName: string, handler: { execute(input: any): Promise<any> }): void;
}

export interface WorkflowRegistrar {
  create(input: {
    name: string;
    description?: string;
    steps: any[];
    status?: "active" | "disabled";
  }): Promise<{ id: string }>;
}

export interface JobScheduler {
  create(input: {
    name: string;
    description?: string;
    schedule: { type: "cron"; expression: string } | { type: "interval"; intervalMs: number };
    target: { type: "workflow"; workflowId: string; input: any } | { type: "task"; taskType: string; payload: any };
    status?: "active" | "disabled";
  }): Promise<{ id: string }>;
}
