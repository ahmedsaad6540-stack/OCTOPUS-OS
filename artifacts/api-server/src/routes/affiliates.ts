import { Router } from "express";
import { db } from "@workspace/db";
import { affiliateConnectionsTable, affiliateProductsTable, affiliateTrackingLinksTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { affiliateEngine } from "../services/affiliate/AffiliateEngine.js";
import { SecretsManager } from "../lib/secrets-manager.js";

const router = Router();
const sm = SecretsManager.instance();

// ==========================================
// Digistore24 Interactive API-Key Authorization
// ==========================================
import { randomBytes, createHash } from "node:crypto";

const oauthStates = new Map<string, { userId: string; workspaceId: string; expiresAt: number }>();

function hashState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

router.post("/affiliate/connections/:provider/request-token", requireAuth, async (req: AuthRequest, res) => {
  try {
    const providerId = req.params.provider as string;
    const provider = await affiliateEngine.getProvider(providerId);
    if (!provider || !provider.requestApiKey) {
      res.status(400).json({ error: "Provider does not support interactive authorization" });
      return;
    }

    const state = randomBytes(32).toString("hex");
    const hashedState = hashState(state);
    
    // Store in-memory map (or DB)
    oauthStates.set(hashedState, {
      userId: req.user!.userId,
      workspaceId: req.user!.userId, // assuming mapping
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    const callbackUrl = `${process.env.PUBLIC_URL || "http://localhost:5173"}/affiliates/callback`;
    const devCredentials = { developerKey: process.env.DIGISTORE_DEV_KEY || "mock_dev_key" };

    const redirectUrl = await provider.requestApiKey(devCredentials, state, callbackUrl);
    res.json({ redirectUrl });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate request token" });
  }
});

router.get("/affiliate/connections/:provider/callback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const providerId = req.params.provider as string;
    const { state, request_token } = req.query as { state: string, request_token: string };
    
    if (!state || !request_token) {
      res.status(400).json({ error: "Missing state or request token" });
      return;
    }

    const hashedState = hashState(state);
    const storedState = oauthStates.get(hashedState);

    if (!storedState || storedState.expiresAt < Date.now()) {
      res.status(400).json({ error: "Invalid or expired state" });
      return;
    }

    if (storedState.userId !== req.user!.userId) {
      res.status(403).json({ error: "State binding mismatch" });
      return;
    }

    // Consume state
    oauthStates.delete(hashedState);

    const provider = await affiliateEngine.getProvider(providerId);
    if (!provider || !provider.retrieveApiKey) {
      res.status(400).json({ error: "Provider does not support retrieveApiKey" });
      return;
    }

    const devCredentials = { developerKey: process.env.DIGISTORE_DEV_KEY || "mock_dev_key" };
    const apiKey = await provider.retrieveApiKey(devCredentials, request_token);

    const encryptedEnv = sm.encrypt(apiKey);

    const [row] = await db.insert(affiliateConnectionsTable)
      .values({
        userId: req.user!.userId,
        provider: providerId,
        affiliateId: "",
        encryptedSecretEnvelope: encryptedEnv,
        credentialStatus: "configured",
        status: "active"
      })
      .onConflictDoUpdate({
        target: [affiliateConnectionsTable.userId, affiliateConnectionsTable.provider],
        set: {
          encryptedSecretEnvelope: encryptedEnv,
          credentialStatus: "configured",
          status: "active",
          updatedAt: new Date()
        }
      })
      .returning();

    // Verify immediately
    const credentials = { apiKey, affiliateId: "" };
    const result = await provider.verifyConnection(credentials);

    await db.update(affiliateConnectionsTable)
      .set({
        credentialStatus: result.authenticated ? "verified" : "invalid",
        lastVerifiedAt: new Date(),
        capabilities: result.capabilities as any
      })
      .where(eq(affiliateConnectionsTable.id, row.id));

    res.json({ success: true, verified: result.authenticated });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process callback" });
  }
});

// ==========================================
// CONNECTIONS
// ==========================================

router.get("/affiliate/connections", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: affiliateConnectionsTable.id,
        provider: affiliateConnectionsTable.provider,
        affiliateId: affiliateConnectionsTable.affiliateId,
        credentialStatus: affiliateConnectionsTable.credentialStatus,
        permissions: affiliateConnectionsTable.permissions,
        capabilities: affiliateConnectionsTable.capabilities,
        lastVerifiedAt: affiliateConnectionsTable.lastVerifiedAt,
        status: affiliateConnectionsTable.status,
      })
      .from(affiliateConnectionsTable)
      .where(eq(affiliateConnectionsTable.userId, req.user!.userId));
    res.json({ connections: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/affiliate/connections/:provider", requireAuth, async (req: AuthRequest, res) => {
  try {
    const providerId = req.params.provider as string;
    const { apiKey, affiliateId } = req.body;
    
    if (!apiKey) {
      res.status(400).json({ error: "API Key is required" });
      return;
    }

    const encryptedEnv = sm.encrypt(apiKey);

    const userId = req.user!.userId;

    // Upsert connection
    const [row] = await db
      .insert(affiliateConnectionsTable)
      .values({
        userId,
        provider: providerId,
        affiliateId: affiliateId || "",
        encryptedSecretEnvelope: encryptedEnv,
        credentialStatus: "configured",
        status: "active"
      })
      .onConflictDoUpdate({
        target: [affiliateConnectionsTable.userId, affiliateConnectionsTable.provider],
        set: {
          affiliateId: affiliateId || "",
          encryptedSecretEnvelope: encryptedEnv,
          credentialStatus: "configured",
          status: "active",
          updatedAt: new Date()
        }
      })
      .returning();

    // Never return the encrypted envelope to the client
    const safeRow = { ...row, encryptedSecretEnvelope: undefined };
    res.status(201).json({ connection: safeRow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/affiliate/connections/:provider/test", requireAuth, async (req: AuthRequest, res) => {
  try {
    const providerId = req.params.provider as string;
    const provider = await affiliateEngine.getProvider(providerId);
    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const userId = req.user!.userId;

    const [row] = await db
      .select()
      .from(affiliateConnectionsTable)
      .where(and(
        eq(affiliateConnectionsTable.userId, userId),
        eq(affiliateConnectionsTable.provider, providerId)
      ));
    
    if (!row || !row.encryptedSecretEnvelope) {
      res.status(400).json({ error: "Connection not configured" });
      return;
    }

    const apiKey = sm.decrypt(row.encryptedSecretEnvelope);
    if (!apiKey) {
      res.status(500).json({ error: "Failed to decrypt credentials" });
      return;
    }

    const credentials = { apiKey, affiliateId: row.affiliateId || "" };
    const result = await provider.verifyConnection(credentials);

    // Update DB with verification result
    await db.update(affiliateConnectionsTable)
      .set({
        credentialStatus: result.authenticated ? "verified" : "invalid",
        lastVerifiedAt: new Date(),
        capabilities: result.capabilities as any
      })
      .where(eq(affiliateConnectionsTable.id, row.id));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/affiliate/connections/:provider", requireAuth, async (req: AuthRequest, res) => {
  try {
    const providerId = req.params.provider as string;
    const userId = req.user!.userId;
    
    const [conn] = await db.select().from(affiliateConnectionsTable)
      .where(and(
        eq(affiliateConnectionsTable.userId, userId),
        eq(affiliateConnectionsTable.provider, providerId)
      ));

    let remoteRevoked = false;
    let remoteFailed = false;

    if (conn && conn.encryptedSecretEnvelope) {
      const provider = await affiliateEngine.getProvider(providerId);
      if (provider && provider.disconnect) {
        const apiKey = sm.decrypt(conn.encryptedSecretEnvelope) || "";
        try {
          // Attempt official revocation
          await provider.disconnect({ apiKey });
          remoteRevoked = true;
        } catch (err) {
          req.log.warn({ err }, `Remote revocation failed for ${providerId}`);
          remoteFailed = true;
        }
      }
    }

    await db.update(affiliateConnectionsTable)
      .set({
        encryptedSecretEnvelope: null,
        credentialStatus: "not_configured",
        status: "revoked",
        revokedAt: new Date(),
        updatedAt: new Date(),
        capabilities: {} // clear capabilities
      })
      .where(and(
        eq(affiliateConnectionsTable.userId, userId),
        eq(affiliateConnectionsTable.provider, providerId)
      ));
      
    res.json({ 
      success: true, 
      message: remoteFailed ? "Local credential revoked. Remote revocation pending or failed." : "Local credential revoked. Remote revocation successful." 
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==========================================
// PRODUCTS & TRACKING
// ==========================================

router.get("/affiliate/products", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(affiliateProductsTable)
      .where(eq(affiliateProductsTable.userId, req.user!.userId));
    res.json({ products: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/affiliate/products/import", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { providerId, productId, productName, promolink } = req.body;
    const provider = await affiliateEngine.getProvider(providerId);
    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const userId = req.user!.userId;

    // Fetch credentials to generate the link
    const [conn] = await db
      .select()
      .from(affiliateConnectionsTable)
      .where(and(
        eq(affiliateConnectionsTable.userId, userId),
        eq(affiliateConnectionsTable.provider, providerId)
      ));
    
    let credentials: Record<string, string> = { affiliateId: conn?.affiliateId || "" };
    if (conn?.encryptedSecretEnvelope) {
      credentials.apiKey = sm.decrypt(conn.encryptedSecretEnvelope) || "";
    }

    const offer = await provider.importProduct({ productId, productName, promolink }, credentials);

    // Save product to DB
    const [savedProduct] = await db.insert(affiliateProductsTable)
      .values({
        userId,
        provider: providerId,
        externalProductId: offer.id,
        name: offer.productName,
        catalogSource: promolink ? "manual_promolink_import" : "manual_product_import",
        promolink: offer.trackingUrl,
      })
      .onConflictDoUpdate({
        target: [affiliateProductsTable.userId, affiliateProductsTable.provider, affiliateProductsTable.externalProductId],
        set: {
          name: offer.productName,
          promolink: offer.trackingUrl,
          updatedAt: new Date()
        }
      }).returning();

    res.json({ product: savedProduct });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to import product" });
  }
});

router.post("/affiliate/products/:id/tracking-link", requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = req.params.id as string;
    const { channel } = req.body;
    const userId = req.user!.userId;

    const [product] = await db.select().from(affiliateProductsTable)
      .where(and(
        eq(affiliateProductsTable.id, productId),
        eq(affiliateProductsTable.userId, userId)
      ));
    
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const provider = await affiliateEngine.getProvider(product.provider);
    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const [conn] = await db.select().from(affiliateConnectionsTable)
      .where(and(
        eq(affiliateConnectionsTable.userId, userId),
        eq(affiliateConnectionsTable.provider, product.provider)
      ));

    let credentials: Record<string, string> = { affiliateId: conn?.affiliateId || "" };
    if (conn?.encryptedSecretEnvelope) {
      credentials.apiKey = sm.decrypt(conn.encryptedSecretEnvelope) || "";
    }

    const trackingResult = await provider.generateTrackingLink({
      productId: product.externalProductId,
      workspaceId: userId,
      channel: channel || "default"
    }, credentials);

    // Persist tracking link
    const [trackingRow] = await db.insert(affiliateTrackingLinksTable)
      .values({
        userId,
        affiliateProductId: product.id,
        provider: product.provider,
        basePromolink: product.promolink || trackingResult.trackingUrl,
        generatedUrl: trackingResult.trackingUrl,
        campaignKey: trackingResult.campaignKey
      })
      .onConflictDoUpdate({
        target: [affiliateTrackingLinksTable.generatedUrl],
        set: { updatedAt: new Date() }
      }).returning();

    res.json({ trackingLink: trackingRow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate tracking link" });
  }
});

export default router;
