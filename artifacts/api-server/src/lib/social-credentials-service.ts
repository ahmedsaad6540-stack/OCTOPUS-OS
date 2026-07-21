import { db } from "@workspace/db";
import { socialCredentialsTable, type SocialCredentialRecord } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import type { SocialCredentials } from "@workspace/social-publisher";
import { SecretsManager } from "./secrets-manager.js";

/**
 * SocialCredentialsService — per-user, per-platform credential vault.
 *
 * Wraps the socialCredentialsTable with transparent AES-256-GCM
 * encryption/decryption so that callers always work with plaintext
 * SocialCredentials while only ciphertext is ever persisted.
 */
export class SocialCredentialsService {
  private sm = SecretsManager.instance();

  /** Retrieve plaintext credentials for a user+platform, or null if not found. */
  async get(userId: string, platform: string): Promise<SocialCredentials | null> {
    const [row] = await db
      .select()
      .from(socialCredentialsTable)
      .where(
        and(
          eq(socialCredentialsTable.userId, userId),
          eq(socialCredentialsTable.platform, platform),
          eq(socialCredentialsTable.status, "active"),
        ),
      )
      .limit(1);

    if (!row) return null;
    return this.rowToCredentials(row);
  }

  /** Upsert credentials for a user+platform (encrypts tokens before writing). */
  async upsert(
    userId: string,
    platform: string,
    credentials: SocialCredentials & { displayName?: string; avatarUrl?: string; accountId?: string },
  ): Promise<void> {
    const existing = await db
      .select({ id: socialCredentialsTable.id })
      .from(socialCredentialsTable)
      .where(
        and(
          eq(socialCredentialsTable.userId, userId),
          eq(socialCredentialsTable.platform, platform),
        ),
      )
      .limit(1);

    const values = {
      userId,
      platform,
      accessTokenEnc: this.sm.encryptOptional(credentials.accessToken),
      refreshTokenEnc: this.sm.encryptOptional(credentials.refreshToken),
      tokenExpiresAt: credentials.tokenExpiresAt ? new Date(credentials.tokenExpiresAt as string) : null,
      accountId: credentials.accountId ?? "",
      displayName: credentials.displayName ?? "",
      avatarUrl: credentials.avatarUrl ?? "",
      status: "active" as const,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(socialCredentialsTable)
        .set(values)
        .where(eq(socialCredentialsTable.id, existing[0]!.id));
    } else {
      await db.insert(socialCredentialsTable).values(values);
    }
  }

  /** Revoke credentials (marks status = revoked, clears tokens). */
  async revoke(userId: string, platform: string): Promise<void> {
    await db
      .update(socialCredentialsTable)
      .set({
        status: "revoked",
        accessTokenEnc: null,
        refreshTokenEnc: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(socialCredentialsTable.userId, userId),
          eq(socialCredentialsTable.platform, platform),
        ),
      );
  }

  private rowToCredentials(row: SocialCredentialRecord): SocialCredentials {
    return {
      accessToken: this.sm.decryptOptional(row.accessTokenEnc),
      refreshToken: this.sm.decryptOptional(row.refreshTokenEnc),
      tokenExpiresAt: row.tokenExpiresAt?.toISOString(),
      accountId: row.accountId ?? undefined,
    };
  }
}

export const socialCredentialsService = new SocialCredentialsService();
