import { db } from "@workspace/db";
import { NotificationManager, DrizzleNotificationChannelStore, DrizzleNotificationDeliveryStore } from "@workspace/notification-system";
import { eventBus } from "./event-bus.js";
import { logger } from "./logger.js";

/**
 * The one Notification Manager for this process. `eventBus` satisfies
 * `@workspace/notification-system`'s local `EventSubscriber` interface
 * structurally — same decoupling as `Brain`/`TaskQueue`/`ToolManager` —
 * so any module can trigger a notification just by publishing a
 * `notification.requested` event, with no direct dependency on this
 * package. Ships `in_app` and `webhook` channels out of the box; no
 * credentials for email/SMS/Slack-app-style channels are available in
 * this environment, so none are faked — register a real factory via
 * `notificationManager.registerChannel()` once one is.
 */
export const notificationManager = new NotificationManager(
  new DrizzleNotificationChannelStore(db),
  new DrizzleNotificationDeliveryStore(db),
  eventBus,
  logger,
);
