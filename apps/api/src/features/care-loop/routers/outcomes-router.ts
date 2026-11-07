import { assignCase } from "@api/features/care-loop/services/assignment-service";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import {
  findCase,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import { listTasks } from "@api/features/care-loop/services/task-queries";
import { completeTask } from "@api/features/care-loop/services/task-service";
import {
  assertClinician,
  assertCoordinator,
  requireStaff,
} from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { caseConsultNotes } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import {
  AssignCaseSchema,
  ConsultNoteSchema,
  RecordConfirmationSchema,
  RecordConsultationSchema,
  RecordDropOffSchema,
  RecordSurveillanceSchema,
  RecordTreatmentSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});
const idParams = Type.Object({ id: Type.String({ minLength: 1 }) });
const at = (value: string | undefined): Date =>
  value === undefined ? new Date() : new Date(value);

const findOrThrow = async (id: string, clinicId: string | null) => {
  const found = await findCase(id, clinicId);
  if (found === null) throw new NotFoundError("Case not found");
  return found;
};

// Clinical milestones are recorded as discrete, timestamped events rather than
// free text, so the patient journey and the outcome measures can trust them.
export const outcomesRouter = new Elysia({ prefix: "/cases" })
  .get(
    "/:id/consult-notes",
    async ({ params, headers }) => {
      // Internal clinical discussion is restricted to clinicians and admins.
      const staff = await assertClinician(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      const rows = await db
        .select()
        .from(caseConsultNotes)
        .where(eq(caseConsultNotes.caseId, found.id))
        .orderBy(caseConsultNotes.createdAt);
      return rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }));
    },
    { params: idParams, headers: authHeader },
  )
  .post(
    "/:id/consult-notes",
    async ({ params, body, headers }) => {
      const staff = await assertClinician(headers);
      const found = await findOrThrow(params.id, staff.clinicId);
      const [note] = await db
        .insert(caseConsultNotes)
        .values({
          caseId: found.id,
          authorId: staff.id,
          authorName: staff.email,
          authorRole: staff.role,
          body: body.body,
        })
        .returning();
      await logAudit(found.id, `staff:${staff.email}`, "consult_note_added", {
        role: staff.role,
      });
      return { ...note, createdAt: note.createdAt.toISOString() };
    },
    { params: idParams, body: ConsultNoteSchema, headers: authHeader },
  )
  .post(
    "/:id/assign",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const updated = await assignCase(staff, params.id, body.assignedToId);
      if (updated === null) throw new NotFoundError("Case not found");
      await logAudit(updated.id, `staff:${staff.email}`, "case_assigned", {
        assignedToId: body.assignedToId,
      });
      return updated;
    },
    { params: idParams, body: AssignCaseSchema, headers: authHeader },
  )
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

export const tasksRouter = new Elysia({ prefix: "/tasks" })
  .get(
    "/",
    async ({ query, headers }) => {
      const staff = await requireStaff(headers);
      return listTasks(staff, {
        caseId: query.caseId,
        status: query.status === "done" ? "done" : "open",
      });
    },
    {
      query: Type.Object({
        caseId: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
      headers: authHeader,
    },
  )
  .post(
    "/:id/complete",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      const done = await completeTask(staff, params.id);
      if (done === null) throw new NotFoundError("Task not found");
      return done;
    },
    { params: idParams, headers: authHeader },
  );
