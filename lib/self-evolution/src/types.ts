export type ProposalType = 'rule' | 'workflow' | 'agent' | 'policy' | 'tool';
export type ProposalStatus = 'pending' | 'simulating' | 'simulation_passed' | 'simulation_failed' | 'approved' | 'deployed' | 'rejected';

export interface EvolutionProposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  proposalData: Record<string, unknown>;
  status: ProposalStatus;
  confidenceScore: number;  // 0-100 after simulation
  simulationResult?: SimulationResult;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimulationResult {
  proposalId: string;
  ranAt: Date;
  durationMs: number;
  passed: boolean;
  confidenceScore: number;
  metrics: {
    estimatedRevenueImpact: number; // USD delta
    estimatedRoiDelta: number;       // percentage delta
    riskLevel: 'low' | 'medium' | 'high';
  };
  logs: string[];
}

export interface DeploymentPlan {
  proposalId: string;
  steps: string[];
  estimatedDurationMs: number;
  requiresRestart: boolean;
}

export interface EvolutionStore {
  insertProposal(proposal: Omit<EvolutionProposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EvolutionProposal>;
  getProposal(id: string): Promise<EvolutionProposal | null>;
  updateProposalStatus(id: string, status: ProposalStatus, simulationResult?: SimulationResult): Promise<EvolutionProposal | null>;
  listProposals(status?: ProposalStatus): Promise<EvolutionProposal[]>;
  listPendingProposals(userId?: string): Promise<EvolutionProposal[]>;
}
