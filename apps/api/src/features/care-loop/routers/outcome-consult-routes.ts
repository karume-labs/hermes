import {
  authHeader,
  findOrThrow,
  idParams,
} from "@api/features/care-loop/routers/outcome-shared";
import { assignCase } from "@api/features/care-loop/services/assignment-service";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import {
  assertClinician,
  assertCoordinator,
} from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { caseConsultNotes } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { AssignCaseSchema, ConsultNoteSchema } from "@hermes/validators";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

// Internal clinical discussion stays with clinicians and admins.
export const outcomeConsultRoutes = new Elysia({ prefix: "/cases" })
  .get(
    "/:id/consult-notes",
    async ({ params, headers }) => {
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
  );
