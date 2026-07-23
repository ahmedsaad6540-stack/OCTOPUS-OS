import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const affiliateNetworksTable = pgTable("affiliate_networks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  network: text("network").notNull(),
  displayName: text("display_name").notNull(),
  apiKey: text("api_key").default(""),
  secretKey: text("secret_key").default(""),
  trackingId: text("tracking_id").default(""),
  affiliateId: text("affiliate_id").default(""),
  websiteId: text("website_id").default(""),
  webhookUrl: text("webhook_url").default(""),
  status: text("status").default("disconnected"),
  totalEarnings: text("total_earnings").default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AffiliateNetwork = typeof affiliateNetworksTable.$inferSelect;
export type InsertAffiliateNetwork = typeof affiliateNetworksTable.$inferInsert;
