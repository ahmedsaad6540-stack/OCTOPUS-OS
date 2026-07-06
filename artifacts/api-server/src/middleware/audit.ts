import type { NextFunction, Response } from "express";
import type { AuditLogger } from "@workspace/audit-observability";
import type { AuthRequest } from "./auth.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Automatically records every successful mutating request (POST/PUT/PATCH/
 * DELETE with a 2xx/3xx response) to the audit log — no individual route
 * file needs to call `auditLogger.record()` itself. Attached once, globally,
 * in `app.ts`, before the router; it reads `req.user` from a `res.on
 * ("finish")` listener, which fires after the full route chain (including
 * whatever `requireAuth` populated) has already run, so the actor is
 * captured correctly even though this middleware itself runs first.
 *
 * `action` is derived as `"<firstPathSegment>.<verb>"` (e.g. `"agents.
 * post"`, `"rules.delete"`) from the *matched route pattern*
 * (`req.route.path`), not the raw URL, so a UUID in the path never leaks
 * into the action name. `resourceId` is taken from `req.params.id` or
 * `req.params.name` when present. Failed requests (4xx/5xx) are not
 * recorded — nothing happened for those, so there's nothing worth
 * auditing yet beyond what request-level logging already captures.
 */
export function createAuditMiddleware(auditLogger: AuditLogger) {
  return function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }

    res.on("finish", () => {
      if (res.statusCode >= 400) return;

      const routePath = req.route?.path as string | undefined;
      const basePath = (routePath ?? req.path).split("/").filter(Boolean)[0] ?? "unknown";
      const verb = req.method.toLowerCase();
      const resourceId = (req.params?.["id"] as string | undefined) ?? (req.params?.["name"] as string | undefined);

      auditLogger
        .record({
          action: `${basePath}.${verb}`,
          resourceType: basePath,
          ...(resourceId ? { resourceId } : {}),
          ...(req.user?.userId ? { actorUserId: req.user.userId } : {}),
          ...(req.user?.role ? { actorRole: req.user.role } : {}),
          ...(req.ip ? { ipAddress: req.ip } : {}),
          metadata: { method: req.method, path: routePath ?? req.path, statusCode: res.statusCode },
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          req.log?.error({ error: message }, "audit_middleware.record_failed");
        });
    });

    next();
  };
}
