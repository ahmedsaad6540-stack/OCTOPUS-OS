import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      res.status(400).json({ error: "Bad Request", message: "email, password, and name are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Bad Request", message: "Password must be at least 8 characters" });
      return;
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Conflict", message: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        password: hashed,
        name,
        role: "user",
      })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (err) {
    req.log.error(err, "Register error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "email and password are required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const { password: _, ...publicUser } = user;

    res.json({ user: publicUser, token });
  } catch (err) {
    req.log.error(err, "Login error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    req.log.error(err, "Me error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/auth/logout", requireAuth, (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
