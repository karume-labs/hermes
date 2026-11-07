import type {
  AuditEntry,
  Booking,
  CareCase,
  CaseAttachment,
  CaseConsultNote,
  CaseFeedback,
  CaseMessage,
  CaseReferral,
  CaseTask,
  NotificationEntry,
  Slot,
} from "./case-records";
import type { JourneyStep, Severity, StaffRole } from "./literals";
import type { Clinic, Patient } from "./people";
export type CaseAssignee = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  clinicId: string | null;
  clinicName: string | null;
};

// ------------------------------------------------------------ composites ----
export type CaseDetail = CareCase & {
  audit: AuditEntry[];
  messages: CaseMessage[];
  notifications: NotificationEntry[];
  appointment: Booking | null;
  slot: Slot | null;
  attachments: CaseAttachment[];
  referrals: CaseReferral[];
  tasks: CaseTask[];
  feedback: CaseFeedback | null;
  consultNotes: CaseConsultNote[];
  assignee: CaseAssignee | null;
};

/** Queue row: the case plus the identity the care team recognises. */
export type CaseListItem = CareCase & {
  patientName: string;
  patientPhone: string;
};

/** One patient-facing case, flattened for the mobile app. */
export type PatientCase = {
  careCase: CareCase;
  appointment: Booking | null;
  slot: Slot | null;
  journeyStage: JourneyStep;
  unreadMessages: number;
};

/** A patient-owned booking with enough context for the mobile visits tab. */
export type PatientBooking = {
  booking: Booking;
  slot: Slot;
  clinicName: string;
  summary: string;
  severity: Severity;
};

/** Clinic schedule row: booking, patient and case in one record. */
export type ClinicAppointment = {
  booking: Booking;
  slot: Slot;
  clinicName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  caseSummary: string;
  severity: Severity;
};

/** Clinic patient roster row with a lightweight care-load summary. */
export type ClinicPatient = Patient & {
  caseCount: number;
  activeCaseCount: number;
  lastCaseId: string | null;
  lastCaseAt: string | null;
};

/** Referral inbox row enriched with the patient and both clinics. */
export type ClinicReferral = CaseReferral & {
  patientName: string;
  caseSummary: string;
  fromClinicName: string;
  toClinicName: string;
};

/** Admin clinic directory row with tenancy activity counts. */
export type AdminClinicSummary = Clinic & {
  patientCount: number;
  staffCount: number;
  openCaseCount: number;
};

/** Global audit row with the patient, clinic and case it belongs to. */
export type AdminAuditEntry = AuditEntry & {
  patientName: string;
  clinicName: string;
  caseSummary: string;
};

export type PatientCaseDetail = PatientCase & {
  messages: CaseMessage[];
  notifications: NotificationEntry[];
  feedback: CaseFeedback | null;
};
