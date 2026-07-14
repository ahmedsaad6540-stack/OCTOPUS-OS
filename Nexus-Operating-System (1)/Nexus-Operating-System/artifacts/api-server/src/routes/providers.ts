import { Router } from "express";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/providers", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.userId, req.user!.userId))
      .orderBy(providersTable.priority);
    res.json({ providers: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/providers", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as Partial<typeof providersTable.$inferInsert>;
    const [row] = await db
      .insert(providersTable)
      .values({ ...body, userId: req.user!.userId })
      .returning();
    res.status(201).json({ provider: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/providers/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<typeof providersTable.$inferInsert>;
    const [row] = await db
      .update(providersTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(providersTable.id, id), eq(providersTable.userId, req.user!.userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ provider: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/providers/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await db
      .delete(providersTable)
      .where(and(eq(providersTable.id, id), eq(providersTable.userId, req.user!.userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/providers/:id/test", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(and(eq(providersTable.id, id), eq(providersTable.userId, req.user!.userId)))
      .limit(1);
    if (!provider) { res.status(404).json({ error: "Not Found" }); return; }
    const online = Boolean(provider.apiKey && provider.apiKey.length > 5);
    await db
      .update(providersTable)
      .set({ status: online ? "online" : "offline", updatedAt: new Date() })
      .where(eq(providersTable.id, id));
    res.json({ success: true, status: online ? "online" : "offline" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
