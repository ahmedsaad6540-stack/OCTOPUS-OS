import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { SecretsManager } from "./secrets-manager.js";

test("SecretsManager Tests", async (t) => {
  const DUMMY_KEY = crypto.randomBytes(32).toString("hex");

  await t.test("1. Fails startup without CREDENTIAL_ENCRYPTION_KEY", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;

    process.env.NODE_ENV = "production";
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;

    assert.throws(
      () => {
        // @ts-ignore
        new SecretsManager();
      },
      /CREDENTIAL_ENCRYPTION_KEY is missing or invalid in production/
    );

    process.env.NODE_ENV = originalEnv;
    process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
  });

  await t.test("2. AES-256-GCM round-trip successfully decrypts", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = DUMMY_KEY;
    // @ts-ignore
    const sm = new SecretsManager();
    const plaintext = "my-super-secret-api-key";

    const envelope = sm.encrypt(plaintext);
    assert.ok(envelope.startsWith("{"), "Envelope should be a JSON string");

    const parsed = JSON.parse(envelope);
    assert.ok(parsed.version, "Version should exist");
    assert.ok(parsed.iv, "IV should exist");
    assert.ok(parsed.ciphertext, "Ciphertext should exist");
    assert.ok(parsed.authTag, "Auth tag should exist");

    assert.equal(sm.decrypt(envelope), plaintext);
  });

  await t.test("3. Fresh random IV on every encryption", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = DUMMY_KEY;
    // @ts-ignore
    const sm = new SecretsManager();
    const plaintext = "identical-plaintext";

    const env1 = JSON.parse(sm.encrypt(plaintext));
    const env2 = JSON.parse(sm.encrypt(plaintext));

    assert.notEqual(env1.iv, env2.iv, "IVs should be unique");
    assert.notEqual(env1.ciphertext, env2.ciphertext, "Ciphertexts should be unique");
    assert.notEqual(env1.authTag, env2.authTag, "Auth tags should be unique");
  });

  await t.test("4. Tampered ciphertext is rejected", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = DUMMY_KEY;
    // @ts-ignore
    const sm = new SecretsManager();
    const env = JSON.parse(sm.encrypt("my-secret"));

    env.ciphertext = env.ciphertext.replace(/[a-f0-9]/, (c: string) => (c === "a" ? "b" : "a"));
    assert.equal(sm.decrypt(JSON.stringify(env)), null);
  });

  await t.test("5. Tampered Auth Tag is rejected", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = DUMMY_KEY;
    // @ts-ignore
    const sm = new SecretsManager();
    const env = JSON.parse(sm.encrypt("my-secret"));

    env.authTag = env.authTag.substring(0, env.authTag.length - 1) + (env.authTag.endsWith("a") ? "b" : "a");
    assert.equal(sm.decrypt(JSON.stringify(env)), null);
  });

  await t.test("6. Tampered IV is rejected", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = DUMMY_KEY;
    // @ts-ignore
    const sm = new SecretsManager();
    const env = JSON.parse(sm.encrypt("my-secret"));

    env.iv = env.iv.substring(0, env.iv.length - 1) + (env.iv.endsWith("a") ? "b" : "a");
    assert.equal(sm.decrypt(JSON.stringify(env)), null);
  });

  await t.test("7. Wrong encryption key is rejected", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
    // @ts-ignore
    const sm1 = new SecretsManager();
    const envelope = sm1.encrypt("my-secret");

    process.env.CREDENTIAL_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
    // @ts-ignore
    const sm2 = new SecretsManager();
    
    assert.equal(sm2.decrypt(envelope), null);
  });

  await t.test("8. Secret envelope contains no plaintext", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = DUMMY_KEY;
    // @ts-ignore
    const sm = new SecretsManager();
    const plaintext = "VERY_SPECIFIC_SECRET_123";
    const envelope = sm.encrypt(plaintext);

    assert.ok(!envelope.includes(plaintext), "Envelope must NOT contain the plaintext");
    const hexPlaintext = Buffer.from(plaintext).toString('hex');
    assert.ok(!envelope.includes(hexPlaintext), "Envelope must NOT contain hex encoded plaintext");
  });
});
