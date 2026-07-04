import { pgTable, text, timestamp, uuid, integer, doublePrecision } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const campaignsTable = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  productName: text("product_name").notNull(),
  productUrl: text("product_url").default(""),
  platform: text("platform").default("tiktok"),
  affiliateNetwork: text("affiliate_network").default(""),
  status: text("status").default("draft"),
  budget: doublePrecision("budget").default(0),
  spent: doublePrecision("spent").default(0),
  revenue: doublePrecision("revenue").default(0),
  conversions: integer("conversions").default(0),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  commission: doublePrecision("commission").default(0),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Campaign = typeof campaignsTable.$inferSelect;
export type InsertCampaign = typeof campaignsTable.$inferInsert;
