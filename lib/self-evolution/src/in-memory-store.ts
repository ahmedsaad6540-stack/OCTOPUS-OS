import { randomUUID } from "node:crypto";
import type { EvolutionProposal, EvolutionStore, ProposalStatus, SimulationResult } from "./types.js";

export class InMemoryEvolutionStore implements EvolutionStore {
  private readonly proposals: EvolutionProposal[] = [];

  async insertProposal(proposal: Omit<EvolutionProposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EvolutionProposal> {
    const record: EvolutionProposal = {
      ...proposal,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.proposals.push(record);
    return record;
  }

  async getProposal(id: string): Promise<EvolutionProposal | null> {
    return this.proposals.find(p => p.id === id) ?? null;
  }

  async updateProposalStatus(id: string, status: ProposalStatus, simulationResult?: SimulationResult): Promise<EvolutionProposal | null> {
    const proposal = this.proposals.find(p => p.id === id);
    if (!proposal) return null;
    proposal.status = status;
    if (simulationResult) {
      proposal.simulationResult = simulationResult;
      proposal.confidenceScore = simulationResult.confidenceScore;
    }
    proposal.updatedAt = new Date();
    return proposal;
  }

  async listProposals(status?: ProposalStatus): Promise<EvolutionProposal[]> {
    return this.proposals.filter(p => !status || p.status === status);
  }

  async listPendingProposals(userId?: string): Promise<EvolutionProposal[]> {
    return this.proposals.filter(p => p.status === 'pending' && (!userId || p.userId === userId));
  }
}
