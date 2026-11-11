import { type Static, Type } from "@sinclair/typebox";

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

// Hand-over between two clinicians. The receiving clinician becomes the owner
// and the sender keeps a read-only seat on the case.
export const handoverSchema = Type.Object({
  toUserId: Type.String({
    minLength: 1,
    error: "Choose the clinician taking over.",
  }),
  note: Type.String({
    minLength: 8,
    maxLength: 2000,
    error: "Add a short note for the hand-over.",
  }),
});
export type HandoverBody = Static<typeof handoverSchema>;
export const HandoverSchema = handoverSchema;

export const caseClinicianSchema = Type.Object({
  userId: Type.String({ minLength: 1 }),
  access: Type.Union([Type.Literal("collaborator"), Type.Literal("read")]),
});
export type CaseClinicianBody = Static<typeof caseClinicianSchema>;
export const CaseClinicianSchema = caseClinicianSchema;

export const assignCaseSchema = Type.Object({
  assignedToId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
});
export type AssignCaseBody = Static<typeof assignCaseSchema>;
export const AssignCaseSchema = assignCaseSchema;
