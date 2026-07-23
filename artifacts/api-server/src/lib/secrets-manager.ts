import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * SecretsManager — AES-256-GCM symmetric encryption for social OAuth tokens.
 *
 * Usage:
 *   const sm = SecretsManager.instance();
 *   const enc = sm.encrypt(rawToken);
 *   const raw = sm.decrypt(enc);
 *
 * The encryption key is loaded from OCTOPUS_SECRET_KEY environment variable.
 * If the env var is absent, a deterministic in-memory key is used (dev mode).
 * In production, OCTOPUS_SECRET_KEY must be a 32-byte hex string (64 chars).
 */
export interface EncryptedSecretEnvelope {
  version: number;
  algorithm: "aes-256-gcm";
  keyVersion: string;
  iv: string;
  ciphertext: string;
  authTag: string;
}

export class SecretsManager {
  private static _instance: SecretsManager | null = null;
  private readonly key: Buffer;

  private constructor() {
    const envKey = process.env["CREDENTIAL_ENCRYPTION_KEY"] || process.env["OCTOPUS_SECRET_KEY"];
    const isProd = process.env["NODE_ENV"] === "production";

    if (envKey && envKey.length === 64) {
      this.key = Buffer.from(envKey, "hex");
    } else {
      if (isProd) {
        throw new Error("[SecretsManager] CRITICAL: CREDENTIAL_ENCRYPTION_KEY is missing or invalid in production.");
      }
      console.warn(
        "[SecretsManager] CREDENTIAL_ENCRYPTION_KEY not set or invalid. Using dev fallback key. " +
        "Set a 64-char hex key in production!"
      );
      this.key = Buffer.from("0".repeat(64), "hex");
    }
  }

  static instance(): SecretsManager {
    if (!SecretsManager._instance) {
      SecretsManager._instance = new SecretsManager();
    }
    return SecretsManager._instance;
  }

  /**
   * Encrypt a plaintext string with AES-256-GCM.
   * Returns a JSON-stringified EncryptedSecretEnvelope.
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const envelope: EncryptedSecretEnvelope = {
      version: 1,
      algorithm: "aes-256-gcm",
      keyVersion: "v1", // Hardcoded for now, can be dynamic later
      iv: iv.toString("hex"),
      ciphertext: encrypted.toString("hex"),
      authTag: authTag.toString("hex"),
    };

    return JSON.stringify(envelope);
  }

  /**
   * Decrypt a JSON string produced by `encrypt()`.
   * Also supports fallback for legacy `iv:authTag:ciphertext` strings.
   * Returns null if decryption fails (tampered or wrong key).
   */
  decrypt(ciphertext: string): string | null {
    try {
      if (ciphertext.startsWith("{")) {
        // Parse JSON envelope
        const envelope = JSON.parse(ciphertext) as EncryptedSecretEnvelope;
        if (envelope.algorithm !== "aes-256-gcm") return null;

        const iv = Buffer.from(envelope.iv, "hex");
        const authTag = Buffer.from(envelope.authTag, "hex");
        const data = Buffer.from(envelope.ciphertext, "hex");
        const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
        decipher.setAuthTag(authTag);
        return decipher.update(data) + decipher.final("utf8");
      } else {
        // Fallback for old format
        const [ivHex, authTagHex, dataHex] = ciphertext.split(":");
        if (!ivHex || !authTagHex || !dataHex) return null;
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const data = Buffer.from(dataHex, "hex");
        const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
        decipher.setAuthTag(authTag);
        return decipher.update(data) + decipher.final("utf8");
      }
    } catch {
      return null;
    }
  }

  /** Encrypt only if value is non-empty; otherwise return null. */
  encryptOptional(value: string | undefined | null): string | null {
    if (!value) return null;
    return this.encrypt(value);
  }

  /** Decrypt only if value is non-null; otherwise return undefined. */
  decryptOptional(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    return this.decrypt(value) ?? undefined;
  }
}
