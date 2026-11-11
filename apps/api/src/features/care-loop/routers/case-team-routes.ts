import {
  authHeader,
  idParams,
} from "@api/features/care-loop/routers/outcome-shared";
import { findCase } from "@api/features/care-loop/services/case-repository";
import {
  addCaseClinician,
  handoverCase,
  removeCaseClinician,
} from "@api/features/care-loop/services/handover-service";
import { listParticipants } from "@api/features/care-loop/services/participants-service";
import { requireStaff, staffScope } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { CaseClinicianSchema, HandoverSchema } from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const memberParams = Type.Object({
  id: Type.String({ minLength: 1 }),
  userId: Type.String({ minLength: 1 }),
});

// Mounted under /cases. Any staff member who can open the case can see who
// else holds it; only a clinician or admin may change that.
export const caseTeamRoutes = new Elysia()
  .get(
    "/:id/clinicians",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      const found = await findCase(params.id, staffScope(staff));
      if (found === null) throw new NotFoundError("Case not found");
      return listParticipants(found.id);
    },
    { params: idParams, headers: authHeader },
  )
  .post(
    "/:id/clinicians",
    async ({ params, body, headers }) => {
      const staff = await requireStaff(headers, [
        "clinician",
        "coordinator",
        "admin",
      ]);
      return addCaseClinician(staff, params.id, body);
    },
    { params: idParams, body: CaseClinicianSchema, headers: authHeader },
  )
  .delete(
    "/:id/clinicians/:userId",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers, [
        "clinician",
        "coordinator",
        "admin",
      ]);
      return removeCaseClinician(staff, params.id, params.userId);
    },
    { params: memberParams, headers: authHeader },
  )
  .post(
    "/:id/handover",
    async ({ params, body, headers }) => {
      const staff = await requireStaff(headers, ["clinician", "admin"]);
      return handoverCase(staff, params.id, body);
    },
    { params: idParams, body: HandoverSchema, headers: authHeader },
  );
