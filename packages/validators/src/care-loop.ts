import { type Static, Type } from "@sinclair/typebox";
import { SeveritySchema } from "./shared";

export const caseSeveritySchema = SeveritySchema;

export const caseStatusSchema = Type.Union([
  Type.Literal("received"),
  Type.Literal("triaged"),
  Type.Literal("notified"),
  Type.Literal("acknowledged"),
  Type.Literal("appointment_booked"),
  Type.Literal("referred"),
  Type.Literal("closed"),
  Type.Literal("escalated"),
]);

export const casesQuerySchema = Type.Object({
  severity: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
});

export const acknowledgeSchema = Type.Object({
  caseId: Type.String({ minLength: 1 }),
  patientId: Type.String({ minLength: 1 }),
});
export const AcknowledgeSchema = acknowledgeSchema;
export type AcknowledgeBody = Static<typeof acknowledgeSchema>;

export const caseMessageSchema = Type.Object({
  body: Type.String({
    minLength: 1,
    maxLength: 2000,
    error: "Write a message between 1 and 2000 characters.",
  }),
  senderId: Type.Optional(Type.String({ minLength: 1 })),
});
export const CaseMessageSchema = caseMessageSchema;
export type CaseMessageBody = Static<typeof caseMessageSchema>;

/** Message composer used by both the dashboard and the patient app. */
export const sendMessageForm = Type.Object({
  body: Type.String({
    minLength: 1,
    maxLength: 2000,
    error: "Write a message between 1 and 2000 characters.",
  }),
});
export type SendMessageForm = Static<typeof sendMessageForm>;

export const closeCaseSchema = Type.Object({
  caseId: Type.String({ minLength: 1 }),
  clinicianId: Type.Optional(Type.String({ minLength: 1 })),
  evidence: Type.String({
    minLength: 8,
    error: "Record the clinical evidence behind this closure.",
  }),
  plan: Type.String({
    minLength: 8,
    error: "Describe the follow-up plan (at least 8 characters).",
  }),
});

export const closeCaseForm = closeCaseSchema;
export const CloseCaseSchema = closeCaseSchema;
export type CloseCaseForm = Static<typeof closeCaseSchema>;

export const referralSchema = Type.Object({
  caseId: Type.String({ minLength: 1 }),
  toClinicId: Type.String({
    minLength: 1,
    error: "Choose the clinic receiving the referral.",
  }),
  note: Type.String({
    minLength: 8,
    error: "Add a short note so the receiving team has context.",
  }),
});

export const referralForm = Type.Object({
  toClinicId: referralSchema.properties.toClinicId,
  note: referralSchema.properties.note,
});
export const ReferralSchema = referralSchema;
export type ReferralForm = Static<typeof referralForm>;
export type ReferralBody = Static<typeof referralSchema>;

export const referralDecisionSchema = Type.Object({
  reason: Type.Optional(Type.String({ maxLength: 400 })),
  assignedToId: Type.Optional(Type.String({ minLength: 1 })),
});
export type ReferralDecisionBody = Static<typeof referralDecisionSchema>;
export const ReferralDecisionSchema = referralDecisionSchema;

export const assignCaseSchema = Type.Object({
  assignedToId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
});
export type AssignCaseBody = Static<typeof assignCaseSchema>;
export const AssignCaseSchema = assignCaseSchema;

export const recordConfirmationSchema = Type.Object({
  status: Type.Union([Type.Literal("confirmed"), Type.Literal("ruled_out")]),
  notes: Type.String({ minLength: 3, maxLength: 2000 }),
  occurredAt: Type.Optional(Type.String({ format: "date-time" })),
});
export type RecordConfirmationBody = Static<typeof recordConfirmationSchema>;
export const RecordConfirmationSchema = recordConfirmationSchema;

export const recordConsultationSchema = Type.Object({
  outcome: Type.Union([
    Type.Literal("confirmed"),
    Type.Literal("alternative_diagnosis"),
    Type.Literal("no_action_needed"),
    Type.Literal("further_referral"),
  ]),
  notes: Type.String({ minLength: 3, maxLength: 2000 }),
  occurredAt: Type.Optional(Type.String({ format: "date-time" })),
});
export type RecordConsultationBody = Static<typeof recordConsultationSchema>;
export const RecordConsultationSchema = recordConsultationSchema;

export const recordTreatmentSchema = Type.Object({
  summary: Type.String({ minLength: 3, maxLength: 2000 }),
  startedAt: Type.Optional(Type.String({ format: "date-time" })),
});
export type RecordTreatmentBody = Static<typeof recordTreatmentSchema>;
export const RecordTreatmentSchema = recordTreatmentSchema;

export const recordSurveillanceSchema = Type.Object({
  plan: Type.String({ minLength: 3, maxLength: 2000 }),
  nextReviewAt: Type.String({ format: "date-time" }),
});
export type RecordSurveillanceBody = Static<typeof recordSurveillanceSchema>;
export const RecordSurveillanceSchema = recordSurveillanceSchema;

export const recordDropOffSchema = Type.Object({
  reason: Type.Union([
    Type.Literal("unreachable"),
    Type.Literal("declined_care"),
    Type.Literal("transport"),
    Type.Literal("cost"),
    Type.Literal("no_show"),
    Type.Literal("other"),
  ]),
  note: Type.Optional(Type.String({ maxLength: 500 })),
});
export type RecordDropOffBody = Static<typeof recordDropOffSchema>;
export const RecordDropOffSchema = recordDropOffSchema;

export const consultNoteSchema = Type.Object({
  body: Type.String({
    minLength: 2,
    maxLength: 2000,
    error: "Write a consultation note between 2 and 2000 characters.",
  }),
});
export type ConsultNoteBody = Static<typeof consultNoteSchema>;
export const ConsultNoteSchema = consultNoteSchema;

export const triageOverrideSchema = Type.Object({
  severity: SeveritySchema,
  clinicId: Type.String({ minLength: 1 }),
  reason: Type.String({ minLength: 1 }),
});
export const TriageOverrideSchema = triageOverrideSchema;
export type TriageOverrideBody = Static<typeof triageOverrideSchema>;
