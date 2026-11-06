import {
  listClinicAppointments,
  listClinicPatients,
  listClinicReferrals,
} from "@api/features/clinic/services/clinic-service";
import { requireStaff } from "@api/features/shared/auth/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const clinicRouter = new Elysia({ prefix: "/clinic" })
  .get(
    "/appointments",
    async ({ headers }) => listClinicAppointments(await requireStaff(headers)),
    { headers: authHeader },
  )
  .get(
    "/patients",
    async ({ headers }) => listClinicPatients(await requireStaff(headers)),
    { headers: authHeader },
  )
  .get(
    "/referrals",
    async ({ headers }) => listClinicReferrals(await requireStaff(headers)),
    { headers: authHeader },
  );
