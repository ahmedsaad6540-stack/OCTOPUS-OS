import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db";
import { PolicyEngine } from "@workspace/business-policy";
import { ProfitMemoryStore, InMemoryProfitMemoryStore, DrizzleProfitMemoryStore } from "@workspace/profit-memory";
import { KnowledgeGraphStore, InMemoryKnowledgeGraphStore, DrizzleKnowledgeGraphStore } from "@workspace/knowledge-graph";
import { StrategyEngine, InMemoryStrategyStore, DrizzleStrategyStore } from "@workspace/strategy-engine";
import { GoalEngine, InMemoryGoalStore, DrizzleGoalStore } from "@workspace/goal-engine";
import { BudgetManager, InMemoryBudgetStore, DrizzleBudgetStore } from "@workspace/budget-manager";
import { ExperimentEngine, InMemoryExperimentStore, DrizzleExperimentStore } from "@workspace/experiment-engine";
import { AdapterRegistry } from "@workspace/network-adapters";
import { ViralDetector, InMemoryViralDetectorStore } from "@workspace/viral-detector";
import { SelfEvolution, InMemoryEvolutionStore } from "@workspace/self-evolution";
import type { ApprovalMode, DashboardStats } from "./types.js";

export class ProfitEngine {
  private mode: ApprovalMode = "LEARNING";
  private readonly db?: NodePgDatabase<typeof schema>;
  public readonly policyEngine: PolicyEngine;
  public readonly profitMemory: ProfitMemoryStore;
  public readonly knowledgeGraph: KnowledgeGraphStore;
  public readonly strategyEngine: StrategyEngine;
  public readonly goalEngine: GoalEngine;
  public readonly budgetManager: BudgetManager;
  public readonly experimentEngine: ExperimentEngine;
  public readonly adapters: AdapterRegistry;
  public readonly viralDetector: ViralDetector;
  public readonly evolution: SelfEvolution;

  constructor(db?: NodePgDatabase<typeof schema>) {
    this.db = db;
    this.policyEngine = new PolicyEngine();
    this.adapters = new AdapterRegistry();

    if (db) {
      this.profitMemory = new DrizzleProfitMemoryStore(db);
      this.knowledgeGraph = new DrizzleKnowledgeGraphStore(db);
      this.strategyEngine = new StrategyEngine(new DrizzleStrategyStore(db));
      this.goalEngine = new GoalEngine(new DrizzleGoalStore(db));
      this.budgetManager = new BudgetManager(new DrizzleBudgetStore(db));
      this.experimentEngine = new ExperimentEngine(new DrizzleExperimentStore(db));
      this.viralDetector = new ViralDetector(new InMemoryViralDetectorStore());
      this.evolution = new SelfEvolution(new InMemoryEvolutionStore());
    } else {
      this.profitMemory = new InMemoryProfitMemoryStore();
      this.knowledgeGraph = new InMemoryKnowledgeGraphStore();
      this.strategyEngine = new StrategyEngine(new InMemoryStrategyStore());
      this.goalEngine = new GoalEngine(new InMemoryGoalStore());
      this.budgetManager = new BudgetManager(new InMemoryBudgetStore());
      this.experimentEngine = new ExperimentEngine(new InMemoryExperimentStore());
      this.viralDetector = new ViralDetector(new InMemoryViralDetectorStore());
      this.evolution = new SelfEvolution(new InMemoryEvolutionStore());
    }
  }

  getMode(): ApprovalMode {
    return this.mode;
  }

  setMode(mode: ApprovalMode): void {
    this.mode = mode;
  }

  async recordSale(sale: {
    campaignId?: string;
    productName: string;
    affiliateNetwork: string;
    trafficSource: string;
    keyword?: string;
    country: string;
    revenue: number;
    commission: number;
    cost: number;
    userId?: string;
  }) {
    this.policyEngine.enforce({
      action: "record_sale",
      userId: sale.userId,
      amount: sale.revenue,
      commissionRate: sale.revenue > 0 ? (sale.commission / sale.revenue) * 100 : 0,
      niche: "general",
    });

    const roi = sale.cost > 0 ? ((sale.revenue - sale.cost) / sale.cost) * 100 : 0;

    if (this.mode === "LEARNING") {
      console.log(`[LEARNING MODE] Virtual sale recorded: ${sale.productName} via ${sale.trafficSource} - Rev: $${sale.revenue}`);
    }

    if (this.db && sale.campaignId) {
      try {
        const [existingCampaign] = await this.db
          .select()
          .from(schema.campaignsTable)
          .where(eq(schema.campaignsTable.id, sale.campaignId))
          .limit(1);

        if (existingCampaign) {
          await this.db
            .update(schema.campaignsTable)
            .set({
              revenue: (existingCampaign.revenue ?? 0) + sale.revenue,
              conversions: (existingCampaign.conversions ?? 0) + 1,
              commission: (existingCampaign.commission ?? 0) + sale.commission,
              spent: (existingCampaign.spent ?? 0) + sale.cost,
              updatedAt: new Date(),
            })
            .where(eq(schema.campaignsTable.id, sale.campaignId));
        }
      } catch (err) {
        console.error("Error updating campaign metrics on sale recording:", err);
      }
    }

    return this.profitMemory.insertSale({
      campaignId: sale.campaignId,
      productName: sale.productName,
      affiliateNetwork: sale.affiliateNetwork,
      trafficSource: sale.trafficSource,
      keyword: sale.keyword,
      country: sale.country,
      revenue: sale.revenue,
      commission: sale.commission,
      cost: sale.cost,
      roi,
      userId: sale.userId,
      occurredAt: new Date(),
    });
  }

  async getDashboard(userId: string): Promise<DashboardStats> {
    const metrics = await this.profitMemory.getMetrics(userId);
    const { active: activeMilestone } = await this.goalEngine.getStatus(userId);
    const pendingProposals = await this.evolution.listPending(userId);

    const proposalsMapped = pendingProposals.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      type: p.type,
      proposalData: p.proposalData,
      status: p.status,
      userId: p.userId ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const bestProducts = metrics.topProducts.map(p => ({
      productName: p.productName,
      revenue: p.revenue,
      conversions: p.conversions,
    }));

    const bestTrafficSources = metrics.topSources.map(s => ({
      source: s.source,
      revenue: s.revenue,
    }));

    const bestCountries = metrics.topCountries.map(c => ({
      country: c.country,
      revenue: c.revenue,
    }));

    const activeGoalMapped = activeMilestone ? {
      id: activeMilestone.id,
      targetRevenue: activeMilestone.targetRevenue,
      currentProgress: activeMilestone.currentRevenue,
      active: activeMilestone.active,
      strategyConfig: {},
      budgetSplits: {},
      userId: activeMilestone.userId ?? null,
      createdAt: activeMilestone.createdAt,
      updatedAt: activeMilestone.updatedAt,
    } : null;

    return {
      hourlyRevenue: [],
      dailyRevenue: [],
      monthlyRevenue: [],
      roi: metrics.roi,
      epc: metrics.epc,
      conversionRate: metrics.conversionRate,
      bestProducts,
      bestTrafficSources,
      bestCountries,
      bestPlatforms: [],
      revenueForecasts: [],
      trendAnalysis: [],
      aiRecommendations: [],
      activeMilestone: activeGoalMapped,
      pendingProposals: proposalsMapped,
    };
  }
}
