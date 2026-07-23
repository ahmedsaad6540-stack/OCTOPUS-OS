import type {
  Opportunity,
  InsertOpportunity,
  LandingPage,
  InsertLandingPage,
  Funnel,
  InsertFunnel,
  MarketingContent,
  InsertMarketingContent,
  VideoJob,
  InsertVideoJob,
  CompetitorInsight,
  InsertCompetitorInsight,
  ProfitMemoryEntry,
  InsertProfitMemoryEntry,
  KnowledgeGraphTriple,
  InsertKnowledgeGraphTriple,
  LongTermMemoryEntry,
  InsertLongTermMemoryEntry,
  StrategicGoal,
  InsertStrategicGoal,
  Proposal,
  InsertProposal,
  DashboardStats
} from "./types.js";

export interface ProfitEngineStore {
  // Opportunities
  insertOpportunity(opp: InsertOpportunity): Promise<Opportunity>;
  listOpportunities(userId?: string): Promise<Opportunity[]>;

  // Landing Pages
  insertLandingPage(page: InsertLandingPage): Promise<LandingPage>;
  getLandingPageByCampaign(campaignId: string): Promise<LandingPage | null>;
  incrementPageTraffic(id: string, isConversion: boolean): Promise<LandingPage | null>;

  // Funnels
  insertFunnel(funnel: InsertFunnel): Promise<Funnel>;
  getFunnelByCampaign(campaignId: string): Promise<Funnel | null>;

  // Content
  insertContent(content: InsertMarketingContent): Promise<MarketingContent>;
  listContentByCampaign(campaignId: string): Promise<MarketingContent[]>;

  // Video Jobs
  insertVideoJob(job: InsertVideoJob): Promise<VideoJob>;
  updateVideoJob(id: string, status: string, publishedUrl?: string): Promise<VideoJob | null>;
  listVideoJobsByCampaign(campaignId: string): Promise<VideoJob[]>;

  // Competitor Insights
  insertCompetitorInsight(insight: InsertCompetitorInsight): Promise<CompetitorInsight>;
  listCompetitorInsights(userId?: string): Promise<CompetitorInsight[]>;

  // Profit Memory
  insertSale(sale: InsertProfitMemoryEntry): Promise<ProfitMemoryEntry>;
  listSales(userId?: string): Promise<ProfitMemoryEntry[]>;

  // Knowledge Graph
  insertTriple(triple: InsertKnowledgeGraphTriple): Promise<KnowledgeGraphTriple>;
  queryTriples(subject?: string, predicate?: string, object?: string): Promise<KnowledgeGraphTriple[]>;

  // Long Term Memory
  insertLongTermEntry(entry: InsertLongTermMemoryEntry): Promise<LongTermMemoryEntry>;
  queryLongTermMemory(keyPattern: string): Promise<LongTermMemoryEntry[]>;

  // Strategic Goals (Milestones)
  insertGoal(goal: InsertStrategicGoal): Promise<StrategicGoal>;
  getActiveGoal(userId?: string): Promise<StrategicGoal | null>;
  updateGoalProgress(id: string, progress: number): Promise<StrategicGoal | null>;

  // Proposals
  insertProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposalStatus(id: string, status: string): Promise<Proposal | null>;
  listPendingProposals(userId?: string): Promise<Proposal[]>;

  // Dashboard Telemetry Calculations
  getDashboardStats(userId: string): Promise<DashboardStats>;
}
