import { Router, type IRouter } from "express";
import { notificationManager } from "../lib/notification-manager.js";
import {
  NotificationChannelDisabledError,
  NotificationChannelNotFoundError,
  UnknownNotificationChannelTypeError,
} from "@workspace/notification-system";
import type {
  CreateNotificationChannelInput,
  NotificationChannelStatus,
  NotificationMessage,
  UpdateNotificationChannelInput,
} from "@workspace/notification-system";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: NotificationChannelStatus[] = ["active", "disabled"];

function validateCreateChannelInput(body: unknown): { error: string } | { input: CreateNotificationChannelInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };
  if (typeof b["channelType"] !== "string" || b["channelType"].length === 0) return { error: "channelType is required" };
  if (!("config" in b)) return { error: "config is required (may be {})" };
  if (b["status"] !== undefined && !STATUSES.includes(b["status"] as NotificationChannelStatus)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  const input: CreateNotificationChannelInput = { name: b["name"], channelType: b["channelType"], config: b["config"] };
  if (typeof b["status"] === "string") input.status = b["status"] as NotificationChannelStatus;
  return { input };
}

function validateUpdateChannelInput(body: unknown): { error: string } | { input: UpdateNotificationChannelInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateNotificationChannelInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["channelType"] !== undefined) {
    if (typeof b["channelType"] !== "string" || b["channelType"].length === 0) {
      return { error: "channelType must be a non-empty string" };
    }
    input.channelType = b["channelType"];
  }
  if (b["config"] !== undefined) input.config = b["config"];
  if (b["status"] !== undefined) {
    if (!STATUSES.includes(b["status"] as NotificationChannelStatus)) {
      return { error: `status must be one of: ${STATUSES.join(", ")}` };
    }
    input.status = b["status"] as NotificationChannelStatus;
  }
  return { input };
}

function validateMessage(value: unknown): { error: string } | { message: NotificationMessage } {
  if (value === null || typeof value !== "object") return { error: "message must be an object" };
  const v = value as Record<string, unknown>;
  if (typeof v["title"] !== "string" || v["title"].length === 0) return { error: "message.title is required" };
  if (typeof v["body"] !== "string" || v["body"].length === 0) return { error: "message.body is required" };
  const message: NotificationMessage = { title: v["title"], body: v["body"] };
  if ("data" in v) message.data = v["data"];
  return { message };
}

/**
 * Channel configuration is admin-only — a channel config can point at an
 * arbitrary webhook URL, so creating one is a system-wide operation.
 * `POST /notifications/send` and the inbox endpoints are open to any
 * authenticated user; non-admins can only send to or read their own
 * `recipientUserId`.
 */
router.post("/notification-channels", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can create notification channels" });
      return;
    }
    const validated = validateCreateChannelInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const channel = await notificationManager.createChannel({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ channel });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/notification-channels", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view notification channels" });
      return;
    }
    const { channelType, status, limit } = req.query;
    if (typeof status === "string" && !STATUSES.includes(status as NotificationChannelStatus)) {
      res.status(400).json({ error: "Bad Request", message: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const channels = await notificationManager.listChannels({
      channelType: typeof channelType === "string" ? channelType : undefined,
      status: typeof status === "string" ? (status as NotificationChannelStatus) : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ channels });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/notification-channels/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view notification channels" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const channel = await notificationManager.getChannel(id);
    if (!channel) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ channel });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/notification-channels/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update notification channels" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const validated = validateUpdateChannelInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const channel = await notificationManager.updateChannel(id, validated.input);
    if (!channel) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ channel });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/notification-channels/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete notification channels" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await notificationManager.deleteChannel(id);
    if (!deleted) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/notifications/send", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body["channelConfigId"] !== "string" || !UUID_RE.test(body["channelConfigId"])) {
      res.status(400).json({ error: "Bad Request", message: "channelConfigId must be a UUID" });
      return;
    }
    const validated = validateMessage(body["message"]);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }

    const isAdmin = req.user!.role === "admin";
    const requestedRecipient = typeof body["recipientUserId"] === "string" ? body["recipientUserId"] : undefined;
    if (requestedRecipient && !isAdmin && requestedRecipient !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden", message: "Non-admins can only send notifications to themselves" });
      return;
    }
    const recipientUserId = requestedRecipient ?? (isAdmin ? undefined : req.user!.userId);

    const delivery = await notificationManager.send(body["channelConfigId"], validated.message, recipientUserId);
    res.status(202).json({ delivery });
  } catch (err) {
    if (err instanceof NotificationChannelNotFoundError) {
      res.status(404).json({ error: "Not Found", message: err.message });
      return;
    }
    if (err instanceof NotificationChannelDisabledError) {
      res.status(409).json({ error: "Conflict", message: err.message });
      return;
    }
    if (err instanceof UnknownNotificationChannelTypeError) {
      res.status(501).json({ error: "Not Implemented", message: err.message });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { read, limit } = req.query;
    const isAdmin = req.user!.role === "admin";
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const deliveries = await notificationManager.listDeliveries({
      // Non-admins only ever see their own inbox.
      ...(isAdmin ? {} : { recipientUserId: req.user!.userId }),
      read: read === "true" ? true : read === "false" ? false : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ deliveries });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const existing = await notificationManager.getDelivery(id);
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && existing.recipientUserId !== req.user!.userId) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const delivery = await notificationManager.markRead(id);
    res.json({ delivery });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
