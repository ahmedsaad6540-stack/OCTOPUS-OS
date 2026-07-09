export interface ExperimentVariant {
  id: string;
  name: string;      // e.g. "Variant A", "Variant B"
  value: string;     // e.g. "Headline 1", "Headline 2"
  visits: number;
  conversions: number;
  revenue: number;
}

export interface Experiment {
  id: string;
  name: string;
  target: 'landing_page' | 'headline' | 'cta' | 'email_subject' | 'creative' | 'price';
  campaignId?: string;
  variants: ExperimentVariant[];
  status: 'running' | 'paused' | 'completed' | 'winner_declared';
  winnerId?: string;
  confidenceLevel: number;
  startedAt: Date;
  endedAt?: Date;
  userId?: string;
}

export interface ExperimentStore {
  createExperiment(experiment: Omit<Experiment, 'id' | 'startedAt'>): Promise<Experiment>;
  getExperiment(id: string): Promise<Experiment | null>;
  updateVariantStats(id: string, variantId: string, visits: number, conversions: number, revenue: number): Promise<Experiment | null>;
  declareWinner(id: string, winnerId: string, confidenceLevel: number): Promise<Experiment | null>;
  listExperiments(status?: Experiment['status'], campaignId?: string): Promise<Experiment[]>;
}
