import type { PatientBooking } from "@hermes/types";

export const statusLabel = (booking: PatientBooking): string => {
  if (booking.booking.status === "confirmed") return "Confirmed";
  if (booking.booking.status === "attended") return "Attended";
  if (booking.booking.status === "no_show") return "Missed";
  if (booking.booking.status === "cancelled") return "Cancelled";
  return "Held";
};
