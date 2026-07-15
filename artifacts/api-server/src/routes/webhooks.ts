import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { profitEngine } from "../lib/profit-engine.js";
import { logger } from "../lib/logger.js";

const router = Router();

/**
 * 🪝 DIGISTORE24 IPN (Instant Payment Notification) Webhook Receiver
 * Endpoint: POST /api/webhooks/digistore24
 *
 * This endpoint receives real purchase notifications from Digistore24,
 * extracts the tracking ID (which is the campaignId), parses the earnings,
 * and records the sale directly into the PostgreSQL database.
 */
router.post("/webhooks/digistore24", async (req, res) => {
  logger.info({ body: req.body }, "Received Digistore24 IPN payload");

  // Digistore24 sends data either as application/x-www-form-urlencoded or JSON
  const payload = req.body as Record<string, any>;

  const transactionId = String(payload.transaction_id || payload.order_id || "");
  const productName = String(payload.product_name || "Digistore24 Product");
  const amount = Number(payload.amount || payload.price || 0);
  const commission = Number(payload.earnings || payload.affiliate_commission || 0);
  const trackingId = String(payload.tracking_id || ""); // This contains our campaignId
  const affiliate = String(payload.affiliate || "");
  const currency = String(payload.currency || "USD");

  // IPN Password verification (optional but recommended for security)
  const configuredIpnPassword = process.env.DIGISTORE24_IPN_PASSWORD;
  const requestIpnPassword = String(payload.ipn_password || payload.sha_sign || "");

  if (configuredIpnPassword && requestIpnPassword !== configuredIpnPassword) {
    logger.warn({ requestIpnPassword }, "Digistore24 IPN password mismatch - verification failed");
    res.status(401).json({ error: "Unauthorized: Invalid IPN password" });
    return;
  }

  if (!transactionId) {
    res.status(400).json({ error: "Bad Request: Missing transaction_id" });
    return;
  }

  try {
    let campaignId: string | undefined = undefined;
    let userId: string | undefined = undefined;

    // Verify if trackingId matches a valid campaign ID in our database
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (trackingId && UUID_RE.test(trackingId)) {
      const [campaign] = await db
        .select()
        .from(campaignsTable)
        .where(eq(campaignsTable.id, trackingId))
        .limit(1);

      if (campaign) {
        campaignId = campaign.id;
        userId = campaign.userId;
        logger.info({ campaignId, userId }, "Matched Digistore24 tracking_id to active campaign");
      }
    }

    // Fallback to default admin user if no campaign matched
    if (!userId) {
      const [defaultUser] = await db.select().from(campaignsTable).limit(1);
      userId = defaultUser?.userId;
    }

    // Record the sale in ProfitEngine
    const saleRecord = await profitEngine.recordSale({
      campaignId,
      productName,
      affiliateNetwork: "digistore24",
      trafficSource: "tiktok",
      country: String(payload.country || "SA"),
      revenue: amount,
      commission: commission,
      cost: 0, // Organic visit conversion cost is zero
      userId,
    });

    logger.info({ saleId: saleRecord.id, transactionId }, "Successfully recorded real Digistore24 sale in PostgreSQL");

    res.status(200).json({
      success: true,
      message: "IPN received and processed successfully",
      saleId: saleRecord.id
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err: errorMsg }, "Error processing Digistore24 IPN");
    res.status(500).json({ error: "Internal Server Error during processing", detail: errorMsg });
  }
});

export default router;
