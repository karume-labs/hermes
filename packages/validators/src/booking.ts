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
