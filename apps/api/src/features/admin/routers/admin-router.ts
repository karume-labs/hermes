import {
  createClinic,
  listAdminAudit,
  listAdminClinics,
  updateClinic,
} from "@api/features/admin/services/admin-service";
import { requireAdmin } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { ClinicCreateSchema, ClinicUpdateSchema } from "@hermes/validators";
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
  .post(
    "/clinics",
    async ({ body, headers }) => {
      await requireAdmin(headers);
      const clinic = await createClinic(body);
      if (clinic === null)
        throw new NotFoundError("Clinic could not be created");
      return clinic;
    },
    { body: ClinicCreateSchema, headers: authHeader },
  )
  .patch(
    "/clinics/:id",
    async ({ params, body, headers }) => {
      await requireAdmin(headers);
      const clinic = await updateClinic(params.id, body);
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
