import { authHeader } from "@api/features/ingestion/routers/webhook-guard";
import {
  listRoutingRules,
  removeRoutingRule,
  upsertRoutingRule,
} from "@api/features/ingestion/services/routing-service";
import {
  requireStaff,
  staffCanAccessClinic,
} from "@api/features/shared/auth/index";
import {
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { RoutingRuleSchema } from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

export const routingRoutes = new Elysia()
  .get(
    "/routing-rules",
    async ({ headers }) => {
      const staff = await requireStaff(headers);
      return listRoutingRules(staff.clinicId);
    },
    { headers: authHeader },
  )
  .put(
    "/routing-rules",
    async ({ body, headers }) => {
      const staff = await requireStaff(headers);
      if (!staffCanAccessClinic(staff, body.clinicId)) {
        throw new ForbiddenError("You can only route to your own clinic.");
      }
      return upsertRoutingRule(body);
    },
    { body: RoutingRuleSchema, headers: authHeader },
  )
  .delete(
    "/routing-rules/:id",
    async ({ params, headers }) => {
      const staff = await requireStaff(headers);
      if (staff.role !== "admin") {
        const own = await listRoutingRules(staff.clinicId);
        if (!own.some((rule) => rule.id === params.id)) {
          throw new NotFoundError("Routing rule not found");
        }
      }
      const removed = await removeRoutingRule(params.id);
      return { removed };
    },
    {
      params: Type.Object({ id: Type.String({ minLength: 1 }) }),
      headers: authHeader,
    },
  );
