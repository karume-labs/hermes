import type { bookings, slots } from "@hermes/db/booking/schema";
import type {
  auditTrail,
  careCases,
  caseConsultNotes,
  caseFeedback,
  caseReferrals,
  caseTasks,
} from "@hermes/db/care-loop/schema";
import type { caseAttachments } from "@hermes/db/documents/schema";
import type { routingRules } from "@hermes/db/ingestion/schema";
import type { notifications, webhookLogs } from "@hermes/db/notify/schema";
import type {
  caseMessages,
  deviceTokens,
  mobileEvents,
} from "@hermes/db/patient/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { Serialized } from "./serialized";

// ------------------------------------------------------- database row types --
export type CareCase = Serialized<InferSelectModel<typeof careCases>>;
export type InsertCareCase = InferInsertModel<typeof careCases>;

export type Slot = Serialized<InferSelectModel<typeof slots>>;
export type Booking = Serialized<InferSelectModel<typeof bookings>>;

export type CaseMessage = Serialized<InferSelectModel<typeof caseMessages>>;
export type NotificationEntry = Serialized<
  InferSelectModel<typeof notifications>
>;
export type WebhookLog = Serialized<InferSelectModel<typeof webhookLogs>>;
export type RoutingRule = Serialized<InferSelectModel<typeof routingRules>>;
export type DeviceToken = Serialized<InferSelectModel<typeof deviceTokens>>;
export type MobileEvent = Serialized<InferSelectModel<typeof mobileEvents>>;

export type AuditEntry = Serialized<InferSelectModel<typeof auditTrail>>;
export type CaseAttachment = Serialized<
  InferSelectModel<typeof caseAttachments>
>;
export type CaseReferral = Serialized<InferSelectModel<typeof caseReferrals>>;
export type CaseTask = Serialized<InferSelectModel<typeof caseTasks>>;
export type CaseFeedback = Serialized<InferSelectModel<typeof caseFeedback>>;
export type CaseConsultNote = Serialized<
  InferSelectModel<typeof caseConsultNotes>
>;
