import {
  updatePatientPreferences,
  verifyPatientCode,
} from "@api/features/patient-auth/services/patient-auth-service";
import { requestPatientCode } from "@api/features/patient-auth/services/patient-code-service";
import { registerPatient } from "@api/features/patient-auth/services/patient-registration-service";
import {
  parseBearerToken,
  requirePatient,
  revokePatientToken,
} from "@api/features/patient-auth/services/patient-session-service";
import { UnauthorizedError } from "@api/features/shared/errors/index";
import {
  clientAddress,
  enforceRateLimit,
} from "@api/features/shared/rate-limit";
import {
  PatientCodeRequestSchema,
  PatientCodeVerifySchema,
  PatientConsentSchema,
  PatientRegisterSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
});

const TEN_MINUTES = 10 * 60 * 1000;

export const patientAuthRouter = new Elysia({ prefix: "/patient-auth" })
  // Public sign-up: patients create their own account. No clinic, no invite.
  .post(
    "/register",
    async ({ body, request, server }) => {
      enforceRateLimit(
        `patient-register:${clientAddress(request.headers, server, request)}`,
        5,
        TEN_MINUTES,
      );
      return registerPatient(body);
    },
    { body: PatientRegisterSchema },
  )
  .post(
    "/request-code",
    async ({ body, request, server }) => {
      enforceRateLimit(
        `patient-code:${clientAddress(request.headers, server, request)}`,
        5,
        TEN_MINUTES,
      );
      return requestPatientCode(body.phone);
    },
    { body: PatientCodeRequestSchema },
  )
  .post(
    "/verify",
    async ({ body, request, server }) => {
      enforceRateLimit(
        `patient-verify:${clientAddress(request.headers, server, request)}`,
        10,
        TEN_MINUTES,
      );
      return verifyPatientCode(body.phone, body.code);
    },
    { body: PatientCodeVerifySchema },
  )
  .get(
    "/session",
    async ({ headers }) => {
      const { patient } = await requirePatient(headers);
      return { patient };
    },
    { headers: authHeader },
  )
  .post(
    "/sign-out",
    async ({ headers }) => {
      const token = parseBearerToken(headers.authorization);
      if (token === null) throw new UnauthorizedError();
      await revokePatientToken(token);
      return { ok: true };
    },
    { headers: authHeader },
  )
  .patch(
    "/consent",
    async ({ body, headers }) => {
      const { patientId } = await requirePatient(headers);
      return updatePatientPreferences(patientId, body);
    },
    { body: PatientConsentSchema, headers: authHeader },
  );
