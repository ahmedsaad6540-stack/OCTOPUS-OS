import { and, desc, eq } from "drizzle-orm";
import { evolutionProposalsTable } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { EvolutionProposal, EvolutionStore, ProposalStatus, ProposalType, SimulationResult } from "./types.js";
import { randomUUID } from "node:crypto";

type Db = NodePgDatabase<any>;

function toEvolutionProposal(row: typeof evolutionProposalsTable.$inferSelect): EvolutionProposal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as ProposalType,
    proposalData: (row.proposalData as Record<string, unknown>) ?? {},
    status: row.status as ProposalStatus,
    confidenceScore: row.confidenceScore ?? 0,
    simulationResult: (row.simulationResult as SimulationResult) ?? undefined,
    userId: row.userId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleEvolutionStore implements EvolutionStore {
  constructor(private readonly db: Db) {}

  async insertProposal(proposal: Omit<EvolutionProposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EvolutionProposal> {
    const id = randomUUID();
    const now = new Date();
    await this.db.insert(evolutionProposalsTable).values({
      id,
      title: proposal.title,
      description: proposal.description,
      type: proposal.type,
      proposalData: proposal.proposalData,
      status: proposal.status,
      confidenceScore: proposal.confidenceScore,
      simulationResult: proposal.simulationResult ?? null,
      userId: proposal.userId ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return { ...proposal, id, createdAt: now, updatedAt: now };
  }

  async getProposal(id: string): Promise<EvolutionProposal | null> {
    const rows = await this.db
      .select()
      .from(evolutionProposalsTable)
      .where(eq(evolutionProposalsTable.id, id))
      .limit(1);
    return rows[0] ? toEvolutionProposal(rows[0]) : null;
  }

  async updateProposalStatus(id: string, status: ProposalStatus, simulationResult?: SimulationResult): Promise<EvolutionProposal | null> {
    const updates: Partial<typeof evolutionProposalsTable.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };
    if (simulationResult) {
      updates.simulationResult = simulationResult;
      updates.confidenceScore = simulationResult.confidenceScore;
    }
    await this.db
      .update(evolutionProposalsTable)
      .set(updates)
      .where(eq(evolutionProposalsTable.id, id));
    return this.getProposal(id);
  }

  async listProposals(status?: ProposalStatus): Promise<EvolutionProposal[]> {
    const rows = await this.db
      .select()
      .from(evolutionProposalsTable)
      .where(status ? eq(evolutionProposalsTable.status, status) : undefined)
      .orderBy(desc(evolutionProposalsTable.createdAt));
    return rows.map(toEvolutionProposal);
  }

  async listPendingProposals(userId?: string): Promise<EvolutionProposal[]> {
    const conditions = [eq(evolutionProposalsTable.status, "pending")];
    if (userId) conditions.push(eq(evolutionProposalsTable.userId, userId));
    const rows = await this.db
      .select()
      .from(evolutionProposalsTable)
      .where(and(...conditions))
      .orderBy(desc(evolutionProposalsTable.createdAt));
    return rows.map(toEvolutionProposal);
  }
}
