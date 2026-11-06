import {
  listAdminAudit,
  listAdminClinics,
} from "@api/features/admin/services/admin-service";
import { requireAdmin } from "@api/features/shared/auth/index";
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
  .get(
    "/audit",
    async ({ headers }) => {
      await requireAdmin(headers);
      return listAdminAudit();
    },
    { headers: authHeader },
  );
