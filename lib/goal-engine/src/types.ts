export type MilestoneLevel = 1000 | 5000 | 10000 | 50000 | 100000 | 1000000;

export interface Milestone {
  id: string;
  targetRevenue: MilestoneLevel;
  label: string;
  description: string;
  requiredStrategies: string[];
}

export const MILESTONES: Milestone[] = [
  { id: 'm1k',  targetRevenue: 1000,    label: '$1K',   description: 'Prove the concept. First paying product.', requiredStrategies: ['single_niche', 'tiktok_organic'] },
  { id: 'm5k',  targetRevenue: 5000,    label: '$5K',   description: 'Validate 3+ products. First paid traffic tests.', requiredStrategies: ['multi_product', 'first_paid_traffic'] },
  { id: 'm10k', targetRevenue: 10000,   label: '$10K',  description: 'Scale winners. Kill losers. Email list building.', requiredStrategies: ['scale_winners', 'kill_losers', 'email_list'] },
  { id: 'm50k', targetRevenue: 50000,   label: '$50K',  description: 'Multi-channel domination. High-ticket products.', requiredStrategies: ['multi_channel', 'high_ticket'] },
  { id: 'm100k',targetRevenue: 100000,  label: '$100K', description: 'Automate operations. Build affiliate army.', requiredStrategies: ['full_automation', 'affiliate_army'] },
  { id: 'm1m',  targetRevenue: 1000000, label: '$1M',  description: 'Brand authority. SaaS + Info products. White label.', requiredStrategies: ['brand_authority', 'saas_products', 'white_label'] },
];

export interface MilestoneProgress {
  id: string;
  milestoneId: string;
  currentRevenue: number;
  targetRevenue: MilestoneLevel;
  progressPercent: number;
  active: boolean;
  completedAt?: Date;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalStore {
  initProgress(milestoneId: string, targetRevenue: MilestoneLevel, userId?: string): Promise<MilestoneProgress>;
  getActiveProgress(userId?: string): Promise<MilestoneProgress | null>;
  updateProgress(id: string, currentRevenue: number): Promise<MilestoneProgress | null>;
  completeAndAdvance(id: string): Promise<MilestoneProgress | null>;
  listProgress(userId?: string): Promise<MilestoneProgress[]>;
}
