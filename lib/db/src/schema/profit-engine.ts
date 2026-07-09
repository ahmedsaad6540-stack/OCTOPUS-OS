import { pgTable, text, timestamp, uuid, jsonb, doublePrecision, integer, index, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { campaignsTable } from "./campaigns.js";

export const opportunitiesTable = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  productName: text("product_name").notNull(),
  affiliateNetwork: text("affiliate_network").notNull(),
  commissionRate: doublePrecision("commission_rate").default(0),
  epc: doublePrecision("epc").default(0),
  score: doublePrecision("score").default(0),
  niche: text("niche").notNull(),
  status: text("status").notNull().default("active"),
  metadata: jsonb("metadata").default({}),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("opportunities_status_idx").on(table.status),
  index("opportunities_user_id_idx").on(table.userId),
]);

export const landingPagesTable = pgTable("landing_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  html: text("html").notNull(),
  config: jsonb("config").default({}),
  visits: integer("visits").default(0),
  conversions: integer("conversions").default(0),
  status: text("status").notNull().default("active"),
  abGroup: text("ab_group").default("A"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("landing_pages_campaign_id_idx").on(table.campaignId),
  index("landing_pages_status_idx").on(table.status),
]);

export const funnelsTable = pgTable("funnels", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  steps: jsonb("steps").notNull().default([]), // e.g. landing -> email -> upsell -> retarget -> cross_sell
  status: text("status").notNull().default("active"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("funnels_campaign_id_idx").on(table.campaignId),
]);

export const marketingContentTable = pgTable("marketing_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // blog, review, social, email, script
  title: text("title").notNull(),
  body: text("body").notNull(),
  language: text("language").default("en"),
  status: text("status").notNull().default("active"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("marketing_content_campaign_id_idx").on(table.campaignId),
  index("marketing_content_type_idx").on(table.type),
]);

export const videoJobsTable = pgTable("video_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  script: text("script").notNull(),
  platform: text("platform").notNull(), // youtube, shorts, tiktok, reels
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  publishedUrl: text("published_url"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("video_jobs_campaign_id_idx").on(table.campaignId),
  index("video_jobs_status_idx").on(table.status),
]);

export const competitorInsightsTable = pgTable("competitor_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  productName: text("product_name").notNull(),
  keywords: jsonb("keywords").default([]),
  strategy: text("strategy"),
  rating: doublePrecision("rating").default(0),
  status: text("status").notNull().default("active"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profitMemoryTable = pgTable("profit_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  affiliateNetwork: text("affiliate_network").notNull(),
  trafficSource: text("traffic_source").notNull(), // tiktok, youtube, google, facebook, etc
  keyword: text("keyword"),
  country: text("country").default("US"),
  revenue: doublePrecision("revenue").default(0),
  commission: doublePrecision("commission").default(0),
  cost: doublePrecision("cost").default(0),
  roi: doublePrecision("roi").default(0),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
}, (table) => [
  index("profit_memory_campaign_id_idx").on(table.campaignId),
  index("profit_memory_occurred_at_idx").on(table.occurredAt),
]);

export const knowledgeGraphTable = pgTable("knowledge_graph", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),     // e.g. "product:SaaS-A", "campaign:123"
  predicate: text("predicate").notNull(), // e.g. "targets_country", "uses_keyword", "associated_with"
  object: text("object").notNull(),       // e.g. "country:US", "keyword:AI", "ROI:2.5"
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("knowledge_graph_subject_idx").on(table.subject),
  index("knowledge_graph_predicate_idx").on(table.predicate),
  index("knowledge_graph_object_idx").on(table.object),
]);

export const longTermMemoryTable = pgTable("long_term_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),             // e.g. "best_cta", "best_hook", "best_hour_US"
  value: text("value").notNull(),         // e.g. "Buy Now", "Wait for this", "18:00"
  metric: doublePrecision("metric").default(0), // e.g. conversion rate, views, CTR
  period: text("period").default("6m"),   // rolling period, e.g. "6m"
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("long_term_memory_key_idx").on(table.key),
]);

export const strategicGoalsTable = pgTable("strategic_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetRevenue: doublePrecision("target_revenue").notNull(), // e.g. 1000, 5000, 50000
  currentProgress: doublePrecision("current_progress").default(0),
  active: boolean("active").default(true),
  strategyConfig: jsonb("strategy_config").default({}), // active strategy, e.g. { countries: ["US", "DE"], focus: "SaaS" }
  budgetSplits: jsonb("budget_splits").default({}),     // platform budget allocation, e.g. { tiktok: 0.4, youtube: 0.3 }
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const proposalsTable = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "workflow", "rule", "agent"
  proposalData: jsonb("proposal_data").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("proposals_status_idx").on(table.status),
]);

// ========== Knowledge Graph (SQL-backed, Neo4j-ready interface) ==========

export const graphNodesTable = pgTable("graph_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // product, keyword, video, landing_page, affiliate_network, sale_event, roi_record, country, audience, competitor, campaign, cta, hook
  label: text("label").notNull(),
  properties: jsonb("properties").notNull().default({}),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("graph_nodes_type_idx").on(table.type),
  index("graph_nodes_user_id_idx").on(table.userId),
]);

export const graphEdgesTable = pgTable("graph_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromNodeId: uuid("from_node_id").notNull().references(() => graphNodesTable.id, { onDelete: "cascade" }),
  toNodeId: uuid("to_node_id").notNull().references(() => graphNodesTable.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(), // e.g. targets_country, drives_sale, uses_keyword, converts_via
  weight: doublePrecision("weight").notNull().default(1.0),
  properties: jsonb("properties").notNull().default({}),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("graph_edges_from_idx").on(table.fromNodeId),
  index("graph_edges_to_idx").on(table.toNodeId),
  index("graph_edges_relation_idx").on(table.relation),
]);

// ========== Business Policy Engine ==========

export const businessPoliciesTable = pgTable("business_policies", {
  id: text("id").primaryKey(), // e.g. MAX_SPEND_PER_DAY
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // financial, ethical, scaling, niche
  config: jsonb("config").notNull().default({}), // policy-specific config, e.g. { limit: 100 }
  enabled: boolean("enabled").notNull().default(true),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ========== Self-Evolution Proposals (replaces old proposals table with richer schema) ==========

export const evolutionProposalsTable = pgTable("evolution_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // rule, workflow, agent, policy, tool
  proposalData: jsonb("proposal_data").notNull(),
  status: text("status").notNull().default("pending"), // pending, simulating, simulation_passed, simulation_failed, approved, deployed, rejected
  confidenceScore: doublePrecision("confidence_score").default(0),
  simulationResult: jsonb("simulation_result"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("evolution_proposals_status_idx").on(table.status),
  index("evolution_proposals_user_id_idx").on(table.userId),
]);

// ========== Trend Signals (Viral Detector) ==========

export const trendSignalsTable = pgTable("trend_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic: text("topic").notNull(),
  platform: text("platform").notNull(), // tiktok, youtube, twitter, facebook, instagram, google_trends
  score: doublePrecision("score").notNull().default(0), // 0-100
  isViral: boolean("is_viral").notNull().default(false),
  relatedKeywords: jsonb("related_keywords").notNull().default([]),
  estimatedReach: integer("estimated_reach").default(0),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
}, (table) => [
  index("trend_signals_platform_idx").on(table.platform),
  index("trend_signals_score_idx").on(table.score),
]);

// ========== Experiments (A/B Testing) ==========

export const experimentsTable = pgTable("experiments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  target: text("target").notNull(), // landing_page, headline, cta, email_subject, creative, price
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "cascade" }),
  variants: jsonb("variants").notNull().default([]),
  status: text("status").notNull().default("running"), // running, paused, completed, winner_declared
  winnerId: text("winner_id"),
  confidenceLevel: doublePrecision("confidence_level").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("experiments_campaign_id_idx").on(table.campaignId),
  index("experiments_status_idx").on(table.status),
]);

// ========== Budget Splits ==========

export const budgetSplitsTable = pgTable("budget_splits", {
  id: uuid("id").primaryKey().defaultRandom(),
  totalDailyBudgetUsd: doublePrecision("total_daily_budget_usd").notNull().default(100),
  allocations: jsonb("allocations").notNull().default([]), // array of { channel, percentage, maxDailyUsd }
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const spendRecordsTable = pgTable("spend_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: text("channel").notNull(), // tiktok, youtube, facebook, etc
  amountUsd: doublePrecision("amount_usd").notNull(),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "set null" }),
  spentAt: timestamp("spent_at").notNull().defaultNow(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
}, (table) => [
  index("spend_records_spent_at_idx").on(table.spentAt),
  index("spend_records_channel_idx").on(table.channel),
]);
