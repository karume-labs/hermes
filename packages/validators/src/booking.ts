import { type Static, Type } from "@sinclair/typebox";

export const bookingRequestSchema = Type.Object({
  caseId: Type.String({ minLength: 1 }),
  slotId: Type.String({ minLength: 1, error: "Choose a slot first." }),
  kind: Type.Union([Type.Literal("in_person"), Type.Literal("telehealth")], {
    error: "Choose an in-person or telehealth visit.",
  }),
});
export const BookingRequestSchema = bookingRequestSchema;
export type BookingRequestBody = Static<typeof bookingRequestSchema>;

export const bookingForm = Type.Object({
  slotId: bookingRequestSchema.properties.slotId,
  kind: bookingRequestSchema.properties.kind,
});
export type BookingForm = Static<typeof bookingForm>;

export const bookingRescheduleSchema = Type.Object({
  slotId: bookingRequestSchema.properties.slotId,
  kind: Type.Optional(bookingRequestSchema.properties.kind),
});
export type BookingReschedule = Static<typeof bookingRescheduleSchema>;
export const BookingRescheduleSchema = bookingRescheduleSchema;

export const bookingCancelSchema = Type.Object({
  reason: Type.Optional(Type.String({ maxLength: 500 })),
});
export type BookingCancel = Static<typeof bookingCancelSchema>;
export const BookingCancelSchema = bookingCancelSchema;

export const bookingOutcomeSchema = Type.Object({
  status: Type.Union([Type.Literal("attended"), Type.Literal("no_show")], {
    error: "Record whether the patient attended or missed the visit.",
  }),
});
export type BookingOutcome = Static<typeof bookingOutcomeSchema>;
export const BookingOutcomeSchema = bookingOutcomeSchema;
