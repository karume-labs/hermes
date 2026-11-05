import { bookings, slots } from "@db/booking/schema/index";
import { auditTrail, careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { routingRules } from "@db/ingestion/schema/index";
import { notifications, webhookLogs } from "@db/notify/schema/index";
import {
  caseMessages,
  deviceTokens,
  mobileEvents,
} from "@db/patient/schema/index";

// Children before parents: bookings restrict slots, everything else cascades
// from care_cases. Only used by `--force`, never by a plain `db:seed`.
export const resetDemoData = async (): Promise<void> => {
  await db.delete(caseMessages);
  await db.delete(mobileEvents);
  await db.delete(deviceTokens);
  await db.delete(bookings);
  await db.delete(notifications);
  await db.delete(routingRules);
  await db.delete(webhookLogs);
  await db.delete(auditTrail);
  await db.delete(slots);
  await db.delete(careCases);
};
