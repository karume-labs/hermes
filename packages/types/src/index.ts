import type * as authSchema from "@hermes/db/auth/schema";
import type { bookings, slots } from "@hermes/db/booking/schema";
import type { auditTrail, careCases } from "@hermes/db/care-loop/schema";
import type { routingRules } from "@hermes/db/ingestion/schema";
import type { notifications, webhookLogs } from "@hermes/db/notify/schema";
import type {
  caseMessages,
  deviceTokens,
  mobileEvents,
} from "@hermes/db/patient/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Drizzle returns `Date` objects; JSON responses carry ISO strings. Shared DTOs
 * describe what actually crosses the wire, so dates are rewritten to strings
 * while every other column type stays exactly as the schema declares it.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends readonly (infer Item)[]
    ? Serialized<Item>[]
    : T extends object
      ? { [Key in keyof T]: Serialized<T[Key]> }
      : T;

// ---------------------------------------------------------------- literals --
export type Severity = "Routine" | "Actionable" | "Urgent";

export type CaseStatus =
  | "received"
  | "triaged"
  | "notified"
  | "acknowledged"
  | "appointment_booked"
  | "referred"
  | "closed"
  | "escalated";

export type NotificationChannel = "push" | "sms" | "email" | "in_app";
export type NotificationStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";
export type NotificationKind =
  | "case_alert"
  | "sms_fallback"
  | "escalation"
  | "secure_message"
  | "visit_reminder";
export type MessageSender = "patient" | "coordinator";
export type MobileEventType =
  | "app_open"
  | "push_opened"
  | "case_viewed"
  | "booking_confirmed"
  | "message_sent";
export type BookingStatus =
  | "held"
  | "confirmed"
  | "attended"
  | "cancelled"
  | "no_show";
export type SlotKind = "in_person" | "telehealth";
export type JourneyStep =
  | "result_received"
  | "appointment_booked"
  | "specialist_consultation"
  | "completed";
export type StaffRole = "coordinator" | "admin";

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

/** Better Auth user row; credentials live in `account`, never here. */
export type StaffUser = Serialized<InferSelectModel<typeof authSchema.user>>;

/** Session row as returned by `/auth/get-session`. */
export type AuthSession = Serialized<
  InferSelectModel<typeof authSchema.session>
>;

export type StaffSession = {
  user: StaffUser;
  session: AuthSession;
};

// ------------------------------------------------------------ composites ----
export type CaseDetail = CareCase & {
  audit: AuditEntry[];
  messages: CaseMessage[];
  notifications: NotificationEntry[];
  appointment: Booking | null;
  slot: Slot | null;
};

/** One patient-facing case, flattened for the mobile app. */
export type PatientCase = {
  careCase: CareCase;
  appointment: Booking | null;
  slot: Slot | null;
  journeyStage: JourneyStep;
  unreadMessages: number;
};

export type PatientCaseDetail = PatientCase & {
  messages: CaseMessage[];
  notifications: NotificationEntry[];
};

export type DeliveryStats = {
  queued: number;
  sent: number;
  failed: number;
  read: number;
  smsQueued: number;
};

export type SeverityCounts = Record<Severity, number>;

export type Metrics = {
  total: number;
  closed: number;
  escalated: number;
  slaBreaches: number;
  slaBreachPct: number;
  pendingAcknowledgement: number;
  avgAckHours: number;
  avgAckBySeverity: SeverityCounts;
  mobileAckPct: number;
  referrals: number;
  referralConversionPct: number;
  appointments: number;
  avgTimeToBookingHours: number;
  pushReadPct: number;
  activePatients7d: number;
  appOpens7d: number;
  retention7dPct: number;
  delivery: DeliveryStats;
  bySeverity: SeverityCounts;
};

/** Envelope every failed request returns, as produced by the API error hook. */
export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
};
