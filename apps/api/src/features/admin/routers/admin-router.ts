import {
  listAdminAudit,
  listAdminClinics,
  setClinicActive,
} from "@api/features/admin/services/admin-service";
import { requireAdmin } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { ClinicUpdateSchema } from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const adminRouter = new Elysia({ prefix: "/admin" })
  .get(
    "/clinics",
    async ({ headers }) => {
      await requireAdmin(headers);
      return listAdminClinics();
    },
    { headers: authHeader },
  )
  .patch(
    "/clinics/:id",
    async ({ params, body, headers }) => {
      await requireAdmin(headers);
      const clinic = await setClinicActive(params.id, body.isActive);
      if (clinic === null) throw new NotFoundError("Clinic not found");
      return clinic;
    },
    {
      params: Type.Object({ id: Type.String({ minLength: 1 }) }),
      body: ClinicUpdateSchema,
      headers: authHeader,
    },
  )
  .get(
    "/audit",
    async ({ headers }) => {
      await requireAdmin(headers);
      return listAdminAudit();
    },
    { headers: authHeader },
  );
