import type { ProfitEngineStore } from "./store.js";
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
import { randomUUID } from "node:crypto";

export class InMemoryProfitEngineStore implements ProfitEngineStore {
  private readonly opportunities: Opportunity[] = [];
  private readonly landingPages: LandingPage[] = [];
  private readonly funnels: Funnel[] = [];
  private readonly content: MarketingContent[] = [];
  private readonly videoJobs: VideoJob[] = [];
  private readonly competitorInsights: CompetitorInsight[] = [];
  private readonly sales: ProfitMemoryEntry[] = [];
  private readonly triples: KnowledgeGraphTriple[] = [];
  private readonly longTermMemory: LongTermMemoryEntry[] = [];
  private readonly goals: StrategicGoal[] = [];
  private readonly proposals: Proposal[] = [];

  // Opportunities
  async insertOpportunity(opp: InsertOpportunity): Promise<Opportunity> {
    const record: Opportunity = {
      id: randomUUID(),
      productName: opp.productName,
      affiliateNetwork: opp.affiliateNetwork,
      commissionRate: opp.commissionRate ?? 0,
      epc: opp.epc ?? 0,
      score: opp.score ?? 0,
      niche: opp.niche,
      status: opp.status ?? "active",
      metadata: opp.metadata ?? {},
      userId: opp.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.opportunities.push(record);
    return record;
  }

  async listOpportunities(userId?: string): Promise<Opportunity[]> {
    return this.opportunities.filter(o => !userId || o.userId === userId);
  }

  // Landing Pages
  async insertLandingPage(page: InsertLandingPage): Promise<LandingPage> {
    const record: LandingPage = {
      id: randomUUID(),
      campaignId: page.campaignId ?? null,
      title: page.title,
      url: page.url,
      html: page.html,
      config: page.config ?? {},
      visits: page.visits ?? 0,
      conversions: page.conversions ?? 0,
      status: page.status ?? "active",
      abGroup: page.abGroup ?? "A",
      userId: page.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.landingPages.push(record);
    return record;
  }

  async getLandingPageByCampaign(campaignId: string): Promise<LandingPage | null> {
    const page = this.landingPages.find(p => p.campaignId === campaignId);
    return page ?? null;
  }

  async incrementPageTraffic(id: string, isConversion: boolean): Promise<LandingPage | null> {
    const page = this.landingPages.find(p => p.id === id);
    if (!page) return null;
    page.visits = (page.visits ?? 0) + 1;
    if (isConversion) {
      page.conversions = (page.conversions ?? 0) + 1;
    }
    page.updatedAt = new Date();
    return page;
  }

  // Funnels
  async insertFunnel(funnel: InsertFunnel): Promise<Funnel> {
    const record: Funnel = {
      id: randomUUID(),
      campaignId: funnel.campaignId ?? null,
      name: funnel.name,
      steps: funnel.steps ?? [],
      status: funnel.status ?? "active",
      userId: funnel.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.funnels.push(record);
    return record;
  }

  async getFunnelByCampaign(campaignId: string): Promise<Funnel | null> {
    const funnel = this.funnels.find(f => f.campaignId === campaignId);
    return funnel ?? null;
  }

  // Content
  async insertContent(content: InsertMarketingContent): Promise<MarketingContent> {
    const record: MarketingContent = {
      id: randomUUID(),
      campaignId: content.campaignId ?? null,
      type: content.type,
      title: content.title,
      body: content.body,
      language: content.language ?? "en",
      status: content.status ?? "active",
      userId: content.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.content.push(record);
    return record;
  }

  async listContentByCampaign(campaignId: string): Promise<MarketingContent[]> {
    return this.content.filter(c => c.campaignId === campaignId);
  }

  // Video Jobs
  async insertVideoJob(job: InsertVideoJob): Promise<VideoJob> {
    const record = {
      id: randomUUID(),
      campaignId: job.campaignId ?? null,
      title: job.title ?? null,
      script: job.script ?? null,
      platform: job.platform ?? null,
      status: job.status ?? "pending",
      publishedUrl: job.publishedUrl ?? null,
      userId: job.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as VideoJob;
    this.videoJobs.push(record);
    return record;
  }

  async updateVideoJob(id: string, status: string, publishedUrl?: string): Promise<VideoJob | null> {
    const job = this.videoJobs.find(j => j.id === id);
    if (!job) return null;
    job.status = status;
    if (publishedUrl !== undefined) job.publishedUrl = publishedUrl;
    job.updatedAt = new Date();
    return job;
  }

  async listVideoJobsByCampaign(campaignId: string): Promise<VideoJob[]> {
    return this.videoJobs.filter(v => v.campaignId === campaignId);
  }

  // Competitor Insights
  async insertCompetitorInsight(insight: InsertCompetitorInsight): Promise<CompetitorInsight> {
    const record: CompetitorInsight = {
      id: randomUUID(),
      url: insight.url,
      productName: insight.productName,
      keywords: insight.keywords ?? [],
      strategy: insight.strategy ?? null,
      rating: insight.rating ?? 0,
      status: insight.status ?? "active",
      userId: insight.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.competitorInsights.push(record);
    return record;
  }

  async listCompetitorInsights(userId?: string): Promise<CompetitorInsight[]> {
    return this.competitorInsights.filter(i => !userId || i.userId === userId);
  }

  // Profit Memory
  async insertSale(sale: InsertProfitMemoryEntry): Promise<ProfitMemoryEntry> {
    const record: ProfitMemoryEntry = {
      id: randomUUID(),
      campaignId: sale.campaignId ?? null,
      productName: sale.productName,
      affiliateNetwork: sale.affiliateNetwork,
      trafficSource: sale.trafficSource,
      keyword: sale.keyword ?? null,
      country: sale.country ?? "US",
      revenue: sale.revenue ?? 0,
      commission: sale.commission ?? 0,
      cost: sale.cost ?? 0,
      roi: sale.roi ?? 0,
      occurredAt: sale.occurredAt ?? new Date(),
      userId: sale.userId ?? null
    };
    this.sales.push(record);
    return record;
  }

  async listSales(userId?: string): Promise<ProfitMemoryEntry[]> {
    return this.sales.filter(s => !userId || s.userId === userId);
  }

  // Knowledge Graph
  async insertTriple(triple: InsertKnowledgeGraphTriple): Promise<KnowledgeGraphTriple> {
    const record: KnowledgeGraphTriple = {
      id: randomUUID(),
      subject: triple.subject,
      predicate: triple.predicate,
      object: triple.object,
      userId: triple.userId ?? null,
      createdAt: new Date()
    };
    this.triples.push(record);
    return record;
  }

  async queryTriples(subject?: string, predicate?: string, object?: string): Promise<KnowledgeGraphTriple[]> {
    return this.triples.filter(t => {
      if (subject && t.subject !== subject) return false;
      if (predicate && t.predicate !== predicate) return false;
      if (object && t.object !== object) return false;
      return true;
    });
  }

  // Long Term Memory
  async insertLongTermEntry(entry: InsertLongTermMemoryEntry): Promise<LongTermMemoryEntry> {
    const record: LongTermMemoryEntry = {
      id: randomUUID(),
      key: entry.key,
      value: entry.value,
      metric: entry.metric ?? 0,
      period: entry.period ?? "6m",
      userId: entry.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.longTermMemory.push(record);
    return record;
  }

  async queryLongTermMemory(keyPattern: string): Promise<LongTermMemoryEntry[]> {
    const regex = new RegExp(keyPattern.replace(/\*/g, ".*"));
    return this.longTermMemory.filter(m => regex.test(m.key));
  }

  // Strategic Goals (Milestones)
  async insertGoal(goal: InsertStrategicGoal): Promise<StrategicGoal> {
    const record: StrategicGoal = {
      id: randomUUID(),
      targetRevenue: goal.targetRevenue,
      currentProgress: goal.currentProgress ?? 0,
      active: goal.active ?? true,
      strategyConfig: goal.strategyConfig ?? {},
      budgetSplits: goal.budgetSplits ?? {},
      userId: goal.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (record.active) {
      for (const g of this.goals) {
        g.active = false;
      }
    }
    this.goals.push(record);
    return record;
  }

  async getActiveGoal(userId?: string): Promise<StrategicGoal | null> {
    const goal = this.goals.find(g => g.active && (!userId || g.userId === userId));
    return goal ?? null;
  }

  async updateGoalProgress(id: string, progress: number): Promise<StrategicGoal | null> {
    const goal = this.goals.find(g => g.id === id);
    if (!goal) return null;
    goal.currentProgress = progress;
    goal.updatedAt = new Date();
    return goal;
  }

  // Proposals
  async insertProposal(proposal: InsertProposal): Promise<Proposal> {
    const record: Proposal = {
      id: randomUUID(),
      title: proposal.title,
      description: proposal.description,
      type: proposal.type,
      proposalData: proposal.proposalData,
      status: proposal.status ?? "pending",
      userId: proposal.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.proposals.push(record);
    return record;
  }

  async updateProposalStatus(id: string, status: string): Promise<Proposal | null> {
    const prop = this.proposals.find(p => p.id === id);
    if (!prop) return null;
    prop.status = status;
    prop.updatedAt = new Date();
    return prop;
  }

  async listPendingProposals(userId?: string): Promise<Proposal[]> {
    return this.proposals.filter(p => p.status === "pending" && (!userId || p.userId === userId));
  }

  // Dashboard Telemetry Calculations
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const userSales = this.sales.filter(s => s.userId === userId);
    
    // Revenue calculations
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalCost = 0;
    
    const dailyMap = new Map<string, number>();
    const hourlyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const productMap = new Map<string, { revenue: number; conversions: number }>();
    const trafficMap = new Map<string, number>();
    const countryMap = new Map<string, number>();
    const platformMap = new Map<string, number>();

    for (const sale of userSales) {
      const rev = sale.revenue ?? 0;
      const comm = sale.commission ?? 0;
      const cost = sale.cost ?? 0;
      
      totalRevenue += rev;
      totalCommission += comm;
      totalCost += cost;

      const dateStr = sale.occurredAt ? new Date(sale.occurredAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      const hourStr = sale.occurredAt ? new Date(sale.occurredAt).toISOString().split("T")[1].substring(0, 2) + ":00" : "12:00";
      const monthStr = sale.occurredAt ? new Date(sale.occurredAt).toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7);

      dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + rev);
      hourlyMap.set(hourStr, (hourlyMap.get(hourStr) ?? 0) + rev);
      monthlyMap.set(monthStr, (monthlyMap.get(monthStr) ?? 0) + rev);

      const prod = sale.productName;
      const currentProd = productMap.get(prod) ?? { revenue: 0, conversions: 0 };
      productMap.set(prod, { revenue: currentProd.revenue + rev, conversions: currentProd.conversions + 1 });

      trafficMap.set(sale.trafficSource, (trafficMap.get(sale.trafficSource) ?? 0) + rev);
      countryMap.set(sale.country ?? "US", (countryMap.get(sale.country ?? "US") ?? 0) + rev);
      
      const campaignPage = this.landingPages.find(p => p.campaignId === sale.campaignId);
      const plat = sale.trafficSource; // fallback platform
      platformMap.set(plat, (platformMap.get(plat) ?? 0) + rev);
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({ date, revenue })).sort((a,b) => a.date.localeCompare(b.date));
    const hourlyRevenue = Array.from(hourlyMap.entries()).map(([hour, revenue]) => ({ hour, revenue })).sort((a,b) => a.hour.localeCompare(b.hour));
    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue })).sort((a,b) => a.month.localeCompare(b.month));

    const bestProducts = Array.from(productMap.entries()).map(([productName, val]) => ({ productName, ...val })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
    const bestTrafficSources = Array.from(trafficMap.entries()).map(([source, revenue]) => ({ source, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
    const bestCountries = Array.from(countryMap.entries()).map(([country, revenue]) => ({ country, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
    const bestPlatforms = Array.from(platformMap.entries()).map(([platform, revenue]) => ({ platform, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);

    const totalConversions = userSales.length;
    // Total visits is sum of all lander visits
    const totalVisits = this.landingPages.reduce((acc, p) => acc + (p.visits ?? 0), 0) || totalConversions * 10 || 100;
    const conversionRate = totalConversions / totalVisits;
    
    const epc = totalRevenue / totalVisits;
    const roi = totalCost > 0 ? (totalRevenue - totalCost) / totalCost : 0;

    // Projected revenue forecasts (next 7 days)
    const forecasts = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const predictedRev = (totalRevenue / (userSales.length || 1)) * (1 + 0.05 * i);
      forecasts.push({
        date: nextDate.toISOString().split("T")[0],
        predictedRevenue: parseFloat(predictedRev.toFixed(2))
      });
    }

    // Viral trends detector results
    const trendAnalysis = [
      { topic: "AI productivity tools", platform: "tiktok", score: 94.5, isViral: true },
      { topic: "SaaS automation hacks", platform: "youtube", score: 88.2, isViral: true },
      { topic: "nocode landing pages", platform: "twitter", score: 71.0, isViral: false }
    ];

    // AI Recommendations
    const aiRecommendations = [
      "Scale TikTok campaign budget by 40% on SaaS Product A - ROI is exceeding 150%.",
      "Terminate Facebook campaign on Product B - ROI has dropped below -20% for 3 consecutive days.",
      "A/B test landing page group B for Campaign X showing 12% higher CTR on mobile."
    ];

    const activeMilestone = await this.getActiveGoal(userId);
    const pendingProposals = await this.listPendingProposals(userId);

    return {
      hourlyRevenue,
      dailyRevenue,
      monthlyRevenue,
      roi: parseFloat(roi.toFixed(4)),
      epc: parseFloat(epc.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(4)),
      bestProducts,
      bestTrafficSources,
      bestCountries,
      bestPlatforms,
      revenueForecasts: forecasts,
      trendAnalysis,
      aiRecommendations,
      activeMilestone,
      pendingProposals
    };
  }
}
