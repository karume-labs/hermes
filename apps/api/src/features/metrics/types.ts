import type { notifications } from "@db/notify/schema/index";
import type { mobileEvents } from "@db/patient/schema/index";

export type NotificationRow = typeof notifications.$inferSelect;
export type MobileEvent = typeof mobileEvents.$inferSelect;
