import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Per-user social-platform credentials store.
 * Tokens are stored encrypted-at-rest (AES-256-GCM) by the SecretsManager.
 * Only the ciphertext blob lives here — the plaintext token never touches
 * a log or API response.
 */
export const socialCredentialsTable = pgTable(
  "social_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),         // tiktok | youtube | instagram | facebook | x | linkedin
    accessTokenEnc: text("access_token_enc"),     // AES-256-GCM ciphertext
    refreshTokenEnc: text("refresh_token_enc"),   // AES-256-GCM ciphertext
    tokenExpiresAt: timestamp("token_expires_at"),
    accountId: text("account_id").default(""),    // platform-specific user/channel ID
    displayName: text("display_name").default(""),
    avatarUrl: text("avatar_url").default(""),
    status: text("status").notNull().default("active"), // active | revoked | expired
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("sc_user_platform_idx").on(t.userId, t.platform),
    index("sc_platform_idx").on(t.platform),
  ],
);

export type SocialCredentialRecord = typeof socialCredentialsTable.$inferSelect;
export type InsertSocialCredentialRecord = typeof socialCredentialsTable.$inferInsert;
