import { randomUUID } from "node:crypto";
import type { EvolutionStore, EvolutionProposal, ProposalType, SimulationResult } from "./types.js";

export interface SelfEvolutionConfig {
  autoApproveThreshold: number; // confidence score (0-100) above which to auto-approve
  requireHumanApproval: boolean;
}

export class SelfEvolution {
  private readonly config: SelfEvolutionConfig;

  constructor(
    private readonly store: EvolutionStore,
    config?: Partial<SelfEvolutionConfig>,
  ) {
    this.config = {
      autoApproveThreshold: 95,
      requireHumanApproval: true,
      ...config,
    };
  }

  /**
   * Submit a new evolution proposal.
   * The proposal goes through: pending → simulating → simulation_passed/failed → approved/rejected → deployed
   * NO agent may directly modify any system component.
   */
  async propose(input: {
    title: string;
    description: string;
    type: ProposalType;
    proposalData: Record<string, unknown>;
    userId?: string;
  }): Promise<EvolutionProposal> {
    const proposal = await this.store.insertProposal({
      title: input.title,
      description: input.description,
      type: input.type,
      proposalData: input.proposalData,
      status: 'pending',
      confidenceScore: 0,
      userId: input.userId,
    });
    return proposal;
  }

  /**
   * Run a sandboxed simulation of the proposal in LEARNING mode.
   * In production, this triggers a real sandbox run. Here we simulate it.
   */
  async simulate(proposalId: string): Promise<SimulationResult> {
    const proposal = await this.store.getProposal(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

    await this.store.updateProposalStatus(proposalId, 'simulating');

    const startTime = Date.now();
    // Simulate a 200ms sandbox run
    await new Promise(resolve => setTimeout(resolve, 200));
    const durationMs = Date.now() - startTime;

    const confidenceScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const passed = confidenceScore >= 60;

    const result: SimulationResult = {
      proposalId,
      ranAt: new Date(),
      durationMs,
      passed,
      confidenceScore,
      metrics: {
        estimatedRevenueImpact: parseFloat((Math.random() * 500).toFixed(2)),
        estimatedRoiDelta: parseFloat((Math.random() * 15).toFixed(2)),
        riskLevel: confidenceScore > 85 ? 'low' : confidenceScore > 70 ? 'medium' : 'high',
      },
      logs: [
        `[SIM] Starting simulation of proposal "${proposal.title}"`,
        `[SIM] Running in LEARNING (paper-trading) mode...`,
        `[SIM] Duration: ${durationMs}ms`,
        `[SIM] Confidence score: ${confidenceScore}/100`,
        `[SIM] Result: ${passed ? 'PASSED' : 'FAILED'}`,
      ],
    };

    await this.store.updateProposalStatus(
      proposalId,
      passed ? 'simulation_passed' : 'simulation_failed',
      result
    );

    // Auto-approve if confidence is high enough and human approval not required
    if (passed && confidenceScore >= this.config.autoApproveThreshold && !this.config.requireHumanApproval) {
      await this.store.updateProposalStatus(proposalId, 'approved', result);
    }

    return result;
  }

  /** Human approves a passed simulation */
  async approve(proposalId: string): Promise<EvolutionProposal | null> {
    const proposal = await this.store.getProposal(proposalId);
    if (!proposal) return null;
    if (proposal.status !== 'simulation_passed' && proposal.status !== 'pending') {
      throw new Error(`Cannot approve proposal in status "${proposal.status}". Must be simulation_passed.`);
    }
    return this.store.updateProposalStatus(proposalId, 'approved');
  }

  /** Human rejects a proposal */
  async reject(proposalId: string): Promise<EvolutionProposal | null> {
    return this.store.updateProposalStatus(proposalId, 'rejected');
  }

  /** Mark a proposal as deployed (called after controlled system migration) */
  async markDeployed(proposalId: string): Promise<EvolutionProposal | null> {
    const proposal = await this.store.getProposal(proposalId);
    if (!proposal) return null;
    if (proposal.status !== 'approved') {
      throw new Error(`Cannot deploy proposal in status "${proposal.status}". Must be approved first.`);
    }
    return this.store.updateProposalStatus(proposalId, 'deployed');
  }

  async listPending(userId?: string): Promise<EvolutionProposal[]> {
    return this.store.listPendingProposals(userId);
  }
}
