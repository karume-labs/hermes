import { type Static, Type } from "@sinclair/typebox";
import { SeveritySchema } from "./shared";

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
