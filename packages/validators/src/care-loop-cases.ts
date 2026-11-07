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
