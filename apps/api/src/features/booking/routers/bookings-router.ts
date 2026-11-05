import {
  bookSlot,
  ensureSlots,
} from "@api/features/booking/services/booking-repository";
import {
  findCase,
  logAudit,
} from "@api/features/care-loop/services/case-repository";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { BookingRequestSchema } from "@hermes/validators";
import { Elysia } from "elysia";

export const bookingsRouter = new Elysia()
  .get("/clinics/:clinicId/slots", ({ params }) => ensureSlots(params.clinicId))
  .post(
    "/bookings",
    async ({ body }) => {
      const found = await findCase(body.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      if (found.status === "closed")
        throw new ConflictError("Case already closed");
      const booking = await bookSlot({
        caseId: found.id,
        slotId: body.slotId,
        kind: body.kind,
      });
      await logAudit(
        found.id,
        `patient:${found.patientId}`,
        "appointment_booked",
        booking,
      );
      return booking;
    },
    { body: BookingRequestSchema },
  );
