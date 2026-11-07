import type { Severity } from "./literals";
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
  referralsAccepted: number;
  referralsCompleted: number;
  referralAcceptancePct: number;
  referralCompletionPct: number;
  unresolvedActionable: number;
  overdue: number;
  appointments: number;
  appointmentsAttended: number;
  appointmentCompletionPct: number;
  avgTimeToBookingHours: number;
  avgTimeToNotificationHours: number;
  avgTimeToConfirmationHours: number;
  avgTimeToConsultationHours: number;
  avgTimeToTreatmentHours: number;
  documentedClosurePct: number;
  patientUnderstandingPct: number;
  avgConfidence: number;
  feedbackCount: number;
  delayReasons: Record<string, number>;
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
