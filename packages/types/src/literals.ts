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
export type StaffRole = "coordinator" | "clinician" | "admin";
export type AttachmentKind =
  | "lab_report"
  | "referral_letter"
  | "closure_evidence"
  | "other";
