import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { settingsManager } from "../lib/settings-manager.js";
import { logger } from "../lib/logger.js";
import {
  AdapterRegistry,
  AmazonAdapter,
  ClickbankAdapter,
  Digistore24Adapter,
  CJAdapter,
  ImpactAdapter,
  PartnerStackAdapter,
  AwinAdapter,
  ShareASaleAdapter
} from "@workspace/network-adapters";

const router = Router();

/**
 * GET /api/network-adapters/products
 * Fetch products dynamically from affiliate network adapters (Amazon, Digistore24, etc.)
 * utilizing configured keys from system settings.
 */
router.get("/network-adapters/products", requireAuth, async (req: AuthRequest, res) => {
  try {
    const niche = String(req.query.niche || "marketing");
    const network = String(req.query.network || "").toLowerCase();
    const limit = Number(req.query.limit || 10);

    // Retrieve credentials from settingsManager
    const [
      amazonAccessKey,
      amazonSecretKey,
      amazonTrackingId,
      digistoreApiKey,
      clickbankApiKey
    ] = await Promise.all([
      settingsManager.get("system", "amazon_access_key").then(s => String(s?.value || "")),
      settingsManager.get("system", "amazon_secret_key").then(s => String(s?.value || "")),
      settingsManager.get("system", "amazon_tracking_id").then(s => String(s?.value || "")),
      settingsManager.get("system", "digistore24_api_key").then(s => String(s?.value || "")),
      settingsManager.get("system", "clickbank_api_key").then(s => String(s?.value || ""))
    ]);

    // Initialize adapters
    const amazon = new AmazonAdapter({
      accessKey: amazonAccessKey,
      secretKey: amazonSecretKey,
      partnerTag: amazonTrackingId || "octopusai-21"
    });

    const clickbank = new ClickbankAdapter(clickbankApiKey);
    const digistore24 = new Digistore24Adapter(digistoreApiKey);
    const cj = new CJAdapter();
    const impact = new ImpactAdapter();
    const partnerstack = new PartnerStackAdapter();
    const awin = new AwinAdapter();
    const shareasale = new ShareASaleAdapter();

    // Register all
    const registry = new AdapterRegistry();
    registry
      .register(amazon)
      .register(clickbank)
      .register(digistore24)
      .register(cj)
      .register(impact)
      .register(partnerstack)
      .register(awin)
      .register(shareasale);

    console.log(`[Products API] Searching niche: "${niche}" on network: "${network || 'ALL'}"`);

    let products = [];
    if (network) {
      const adapter = registry.get(network);
      if (adapter) {
        products = await adapter.fetchProducts(niche, { limit });
      } else {
        res.status(400).json({ error: `Unsupported or unregistered network: ${network}` });
        return;
      }
    } else {
      products = await registry.fetchFromAll(niche, 0);
    }

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "Failed to fetch products from adapters");
    res.status(500).json({ error: "Internal Server Error", detail: msg });
  }
});

export default router;
