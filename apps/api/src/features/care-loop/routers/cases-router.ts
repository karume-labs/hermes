import { caseInteractionRoutes } from "@api/features/care-loop/routers/case-interaction-routes";
import {
  authHeader,
  idParams,
} from "@api/features/care-loop/routers/outcome-shared";
import { getCaseDetail } from "@api/features/care-loop/services/case-detail";
import {
  findCase,
  listCases,
} from "@api/features/care-loop/services/case-repository";
import { listMessages } from "@api/features/patient/services/patient-repository";
import { requireStaff } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const listQuery = Type.Object({
  severity: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  assigned: Type.Optional(Type.String()),
  unassigned: Type.Optional(Type.String()),
  overdue: Type.Optional(Type.String()),
});

const baseRouter = new Elysia({ prefix: "/cases" })
  .get(
    "/",
    async ({ query, headers }) => {
      const staff = await requireStaff(headers);
      return listCases(
        {
          severity: query.severity,
          status: query.status,
          assignedToId: query.assigned === "me" ? staff.id : undefined,
          unassigned: query.unassigned === "true",
          overdue: query.overdue === "true",
        },
        staff.clinicId,
      );
    },
    { query: listQuery, headers: authHeader },
  )
  .get(
    "/:id",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      const detail = await getCaseDetail(params.id, staff);
      if (detail === null) throw new NotFoundError("Case not found");
      return detail;
    },
    { params: idParams, headers: authHeader },
  )
  .get(
    "/:id/messages",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      const found = await findCase(params.id, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      return listMessages(found.id);
    },
    { params: idParams, headers: authHeader },
  );

export const casesRouter = baseRouter.use(caseInteractionRoutes);
