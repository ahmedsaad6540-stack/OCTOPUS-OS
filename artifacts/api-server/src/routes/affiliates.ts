import { Router } from "express";
import { db } from "@workspace/db";
import { affiliateNetworksTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/affiliates", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(affiliateNetworksTable)
      .where(eq(affiliateNetworksTable.userId, req.user!.userId));
    res.json({ networks: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/affiliates", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as Partial<typeof affiliateNetworksTable.$inferInsert>;
    const [row] = await db
      .insert(affiliateNetworksTable)
      .values({ ...body, userId: req.user!.userId } as typeof affiliateNetworksTable.$inferInsert)
      .returning();
    res.status(201).json({ network: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/affiliates/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof affiliateNetworksTable.$inferInsert>;
    const [row] = await db
      .update(affiliateNetworksTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(affiliateNetworksTable.id, id), eq(affiliateNetworksTable.userId, req.user!.userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ network: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/affiliates/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .delete(affiliateNetworksTable)
      .where(and(eq(affiliateNetworksTable.id, id), eq(affiliateNetworksTable.userId, req.user!.userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
