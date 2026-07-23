import { pgTable, text, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";

export const billingSubscriptionsTable = pgTable("billing_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull(), // 'free', 'pro', 'agency'
  status: text("status").notNull(), // 'active', 'canceled', 'past_due'
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usageLimitsTable = pgTable("usage_limits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  monthYear: text("month_year").notNull(), // e.g. "2026-07"
  aiTokensUsed: integer("ai_tokens_used").notNull().default(0),
  aiTokensLimit: integer("ai_tokens_limit").notNull().default(100000),
  videoMinutesUsed: integer("video_minutes_used").notNull().default(0),
  videoMinutesLimit: integer("video_minutes_limit").notNull().default(10),
  campaignsActive: integer("campaigns_active").notNull().default(0),
  campaignsLimit: integer("campaigns_limit").notNull().default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
