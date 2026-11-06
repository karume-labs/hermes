import * as bookingSchema from "@db/booking/schema/index";
import * as careLoopSchema from "@db/care-loop/schema/index";
import { db } from "@db/client";
import * as documentsSchema from "@db/documents/schema/index";
import * as ingestionSchema from "@db/ingestion/schema/index";
import * as notifySchema from "@db/notify/schema/index";
import * as patientSchema from "@db/patient/schema/index";

// Composed schema entry: single import surface backed by real client logic.
export const dbSchema = {
  ...careLoopSchema,
  ...bookingSchema,
  ...notifySchema,
  ...patientSchema,
  ...ingestionSchema,
  ...documentsSchema,
};
export type { Db } from "@db/client";
export { db };
