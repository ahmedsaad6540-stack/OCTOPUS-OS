import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/campaigns", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.userId, req.user!.userId))
      .orderBy(campaignsTable.createdAt);
    res.json({ campaigns: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/campaigns", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as Partial<typeof campaignsTable.$inferInsert>;
    const [row] = await db
      .insert(campaignsTable)
      .values({ ...body, userId: req.user!.userId } as typeof campaignsTable.$inferInsert)
      .returning();
    res.status(201).json({ campaign: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/campaigns/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof campaignsTable.$inferInsert>;
    const [row] = await db
      .update(campaignsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ campaign: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/campaigns/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .delete(campaignsTable)
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
