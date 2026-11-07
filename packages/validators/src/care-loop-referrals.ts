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

export const assignCaseSchema = Type.Object({
  assignedToId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
});
export type AssignCaseBody = Static<typeof assignCaseSchema>;
export const AssignCaseSchema = assignCaseSchema;
