import {
  findCase,
  listAudit,
} from "@api/features/care-loop/services/case-repository";
import { buildMetrics } from "@api/features/metrics/services/metrics-service";
import { requireStaff } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const metricsRouter = new Elysia()
  .get(
    "/metrics",
    async ({ headers }) => {
      const staff = await requireStaff(headers);
      return buildMetrics(staff.clinicId);
    },
    { headers: authHeader },
  )
  .get(
    "/audit/:caseId",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      const found = await findCase(params.caseId, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      return listAudit(found.id);
    },
    { headers: authHeader },
  );
