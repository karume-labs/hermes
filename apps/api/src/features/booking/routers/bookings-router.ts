import {
  cancelBooking,
  rescheduleBooking,
} from "@api/features/booking/services/booking-cancel";
import { recordBookingOutcome } from "@api/features/booking/services/booking-outcome";
import {
  bookSlot,
  findBooking,
  patientHasCaseAtClinic,
} from "@api/features/booking/services/booking-repository";
import { ensureSlots } from "@api/features/booking/services/slot-service";
import {
  findCase,
  logAudit,
} from "@api/features/care-loop/services/case-repository";
import {
  type CarePrincipal,
  requireCarePrincipal,
  requireStaff,
  staffCanAccessClinic,
} from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import {
  BookingCancelSchema,
  BookingOutcomeSchema,
  BookingRequestSchema,
  BookingRescheduleSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

const actorOf = (principal: CarePrincipal): string =>
  principal.kind === "staff"
    ? `staff:${principal.staff.email}`
    : `patient:${principal.patient.patientId}`;

const caseForPrincipal = async (principal: CarePrincipal, caseId: string) => {
  if (principal.kind === "staff") {
    return findCase(caseId, principal.staff.clinicId);
  }
  const found = await findCase(caseId);
  if (found === null || found.patientId !== principal.patient.patientId) {
    return null;
  }
  return found;
};

const bookingForPrincipal = async (
  principal: CarePrincipal,
  bookingId: string,
) => {
  const booking = await findBooking(bookingId);
  if (booking === null) return null;
  const careCase = await caseForPrincipal(principal, booking.caseId);
  if (careCase === null) return null;
  return { booking, careCase };
};

export const bookingsRouter = new Elysia()
  .get(
    "/clinics/:clinicId/slots",
    async ({ params, headers }) => {
      const principal = await requireCarePrincipal(headers);
      if (principal.kind === "staff") {
        if (!staffCanAccessClinic(principal.staff, params.clinicId)) {
          throw new NotFoundError("Clinic not found");
        }
      } else if (
        principal.patient.patient.clinicId !== params.clinicId &&
        !(await patientHasCaseAtClinic(
          principal.patient.patientId,
          params.clinicId,
        ))
      ) {
        throw new NotFoundError("Clinic not found");
      }
      return ensureSlots(params.clinicId);
    },
    { headers: authHeader },
  )
  .post(
    "/bookings",
    async ({ body, headers }) => {
      const principal = await requireCarePrincipal(headers);
      const found = await caseForPrincipal(principal, body.caseId);
      if (found === null) throw new NotFoundError("Case not found");

      const booking = await bookSlot({
        caseId: found.id,
        slotId: body.slotId,
        kind: body.kind,
      });
      await logAudit(found.id, actorOf(principal), "appointment_booked", {
        booking,
      });
      return booking;
    },
    { body: BookingRequestSchema, headers: authHeader },
  )
  .post(
    "/bookings/:id/cancel",
    async ({ params, body, headers }) => {
      const principal = await requireCarePrincipal(headers);
      const owned = await bookingForPrincipal(principal, params.id);
      if (owned === null) throw new NotFoundError("Booking not found");

      await cancelBooking(owned.booking.id, owned.careCase.id);
      await logAudit(
        owned.careCase.id,
        actorOf(principal),
        "appointment_cancelled",
        { bookingId: owned.booking.id, reason: body.reason ?? null },
      );
      return { ok: true };
    },
    { body: BookingCancelSchema, headers: authHeader },
  )
  .post(
    "/bookings/:id/reschedule",
    async ({ params, body, headers }) => {
      const principal = await requireCarePrincipal(headers);
      const owned = await bookingForPrincipal(principal, params.id);
      if (owned === null) throw new NotFoundError("Booking not found");

      const booking = await rescheduleBooking({
        bookingId: owned.booking.id,
        caseId: owned.careCase.id,
        slotId: body.slotId,
        kind: body.kind,
      });
      await logAudit(
        owned.careCase.id,
        actorOf(principal),
        "appointment_rescheduled",
        { from: owned.booking.slotId, to: booking.slotId },
      );
      return booking;
    },
    { body: BookingRescheduleSchema, headers: authHeader },
  )
  .patch(
    "/bookings/:id/outcome",
    async ({ params, body, headers }) => {
      const staff = await requireStaff(headers);
      const booking = await recordBookingOutcome(
        staff.clinicId,
        params.id,
        body.status,
      );
      if (booking === null) throw new NotFoundError("Booking not found");
      await logAudit(
        booking.caseId,
        `staff:${staff.email}`,
        body.status === "attended"
          ? "appointment_attended"
          : "appointment_no_show",
        { bookingId: booking.id },
      );
      return booking;
    },
    { body: BookingOutcomeSchema, headers: authHeader },
  );
