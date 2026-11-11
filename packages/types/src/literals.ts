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
  | "visit_reminder"
  | "staff_alert";
export type MessageSender = "patient" | "coordinator" | "clinician";
export type ConfirmationStatus = "pending" | "confirmed" | "ruled_out";
export type ConsultationOutcome =
  | "confirmed"
  | "alternative_diagnosis"
  | "no_action_needed"
  | "further_referral";
export type ReferralStatus = "sent" | "accepted" | "declined" | "completed";
export type CaseTaskKind =
  | "escalation"
  | "overdue"
  | "referral"
  | "assignment"
  | "surveillance_review"
  | "patient_followup";
export type CaseTaskStatus = "open" | "done";
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
// `org_admin` runs one organization: its clinics, its staff and its invites.
// `admin` is the platform operator and is not tied to an organization.
export type StaffRole = "coordinator" | "clinician" | "org_admin" | "admin";

/** How a clinician holds a case: the owner, a collaborator, or read-only. */
export type CaseAccess = "owner" | "collaborator" | "read";

/** Where a person wants their alerts delivered. */
export type NotificationPreference = "email" | "in_app" | "both";

export type EmailStatus = "sent" | "failed" | "skipped";
export type AttachmentKind =
  | "lab_report"
  | "referral_letter"
  | "closure_evidence"
  | "other";
