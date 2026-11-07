import {
  at,
  authHeader,
  findOrThrow,
  idParams,
} from "@api/features/care-loop/routers/outcome-shared";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import { updateCase } from "@api/features/care-loop/services/case-repository";
import { assertCoordinator } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import {
  RecordConfirmationSchema,
  RecordConsultationSchema,
  RecordDropOffSchema,
  RecordSurveillanceSchema,
  RecordTreatmentSchema,
} from "@hermes/validators";
import { Elysia } from "elysia";

// Clinical milestones are recorded as discrete, timestamped events rather than
// free text, so the patient journey and the outcome measures can trust them.
export const outcomeMilestoneRoutes = new Elysia({ prefix: "/cases" })
  .post(
    "/:id/confirmation",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      if (found.status === "closed")
        throw new NotFoundError("Case already closed");
      const occurredAt = at(body.occurredAt);
      const updated = await updateCase(found.id, {
        confirmationStatus: body.status,
        confirmedAt: occurredAt,
        confirmationNotes: body.notes,
        assignedToId: found.assignedToId ?? staff.id,
      });
      await logAudit(
        found.id,
        `staff:${staff.email}`,
        "confirmation_recorded",
        {
          status: body.status,
          notes: body.notes,
          occurredAt: occurredAt.toISOString(),
        },
      );
      return updated;
    },
    { params: idParams, body: RecordConfirmationSchema, headers: authHeader },
  )
  .post(
    "/:id/consultation",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      if (found.status === "closed")
        throw new NotFoundError("Case already closed");
      const occurredAt = at(body.occurredAt);
      const updated = await updateCase(found.id, {
        consultedAt: occurredAt,
        consultationOutcome: body.outcome,
        consultationNotes: body.notes,
        assignedToId: found.assignedToId ?? staff.id,
      });
      await logAudit(
        found.id,
        `staff:${staff.email}`,
        "consultation_recorded",
        {
          outcome: body.outcome,
          notes: body.notes,
          occurredAt: occurredAt.toISOString(),
        },
      );
      return updated;
    },
    { params: idParams, body: RecordConsultationSchema, headers: authHeader },
  )
  .post(
    "/:id/treatment",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      if (found.status === "closed")
        throw new NotFoundError("Case already closed");
      const startedAt = at(body.startedAt);
      const updated = await updateCase(found.id, {
        treatmentStartedAt: startedAt,
        treatmentSummary: body.summary,
      });
      await logAudit(found.id, `staff:${staff.email}`, "treatment_recorded", {
        summary: body.summary,
        startedAt: startedAt.toISOString(),
      });
      return updated;
    },
    { params: idParams, body: RecordTreatmentSchema, headers: authHeader },
  )
  .post(
    "/:id/surveillance",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      const updated = await updateCase(found.id, {
        surveillancePlan: body.plan,
        nextReviewAt: new Date(body.nextReviewAt),
      });
      await logAudit(
        found.id,
        `staff:${staff.email}`,
        "surveillance_recorded",
        {
          plan: body.plan,
          nextReviewAt: body.nextReviewAt,
        },
      );
      return updated;
    },
    { params: idParams, body: RecordSurveillanceSchema, headers: authHeader },
  )
  .post(
    "/:id/drop-off",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      const updated = await updateCase(found.id, {
        dropOffReason: body.reason,
      });
      await logAudit(found.id, `staff:${staff.email}`, "drop_off_recorded", {
        reason: body.reason,
        note: body.note,
      });
      return updated;
    },
    { params: idParams, body: RecordDropOffSchema, headers: authHeader },
  );
