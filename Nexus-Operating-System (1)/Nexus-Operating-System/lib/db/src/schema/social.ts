import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const socialAccountsTable = pgTable("social_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  displayName: text("display_name").notNull(),
  username: text("username").default(""),
  accessToken: text("access_token").default(""),
  refreshToken: text("refresh_token").default(""),
  tokenExpiresAt: timestamp("token_expires_at"),
  apiKey: text("api_key").default(""),
  apiSecret: text("api_secret").default(""),
  status: text("status").default("disconnected"),
  avatarUrl: text("avatar_url").default(""),
  followers: text("followers").default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SocialAccount = typeof socialAccountsTable.$inferSelect;
export type InsertSocialAccount = typeof socialAccountsTable.$inferInsert;
