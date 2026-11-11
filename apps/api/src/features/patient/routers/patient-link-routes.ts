import { linkPatientByPhone } from "@api/features/patient/services/patient-link-service";
import { requireStaff } from "@api/features/shared/auth/index";
import { PatientLinkSchema } from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

// Registered before the /patients/:patientId routes so `link` is never parsed
// as a patient id.
export const patientLinkRoutes = new Elysia({ prefix: "/patients" }).post(
  "/link",
  async ({ body, headers }) => {
    const staff = await requireStaff(headers, [
      "coordinator",
      "clinician",
      "org_admin",
      "admin",
    ]);
    return linkPatientByPhone(staff, body.phone);
  },
  { body: PatientLinkSchema, headers: authHeader },
);
