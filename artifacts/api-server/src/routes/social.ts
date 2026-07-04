import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/social", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, req.user!.userId));
    res.json({ accounts: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/social", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as Partial<typeof socialAccountsTable.$inferInsert>;
    const [row] = await db
      .insert(socialAccountsTable)
      .values({ ...body, userId: req.user!.userId } as typeof socialAccountsTable.$inferInsert)
      .returning();
    res.status(201).json({ account: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/social/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof socialAccountsTable.$inferInsert>;
    const [row] = await db
      .update(socialAccountsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(socialAccountsTable.id, id), eq(socialAccountsTable.userId, req.user!.userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ account: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/social/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .delete(socialAccountsTable)
      .where(and(eq(socialAccountsTable.id, id), eq(socialAccountsTable.userId, req.user!.userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
