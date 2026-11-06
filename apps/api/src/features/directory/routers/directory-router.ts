import { listClinics } from "@api/features/directory/services/directory-service";
import { requireStaff } from "@api/features/shared/auth/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const directoryRouter = new Elysia().get(
  "/clinics",
  async ({ headers }) => {
    await requireStaff(headers);
    return listClinics();
  },
  { headers: authHeader },
);
