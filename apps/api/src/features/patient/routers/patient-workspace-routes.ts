import {
  listPatientNotifications,
  markNotificationReadForPatient,
} from "@api/features/notify/services/notification-service";
import {
  patientFrom,
  patientParams,
} from "@api/features/patient/routers/patient-guard";
import { listPatientBookings } from "@api/features/patient/services/patient-bookings";
import {
  recordMobileEvent,
  registerDevice,
} from "@api/features/patient/services/patient-device-service";
import {
  findPatientCase,
  listPatientCases,
} from "@api/features/patient/services/patient-repository";
import { NotFoundError } from "@api/features/shared/errors/index";
import { DeviceTokenSchema, MobileEventSchema } from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

export const patientWorkspaceRoutes = new Elysia({ prefix: "/patients" })
  .get(
    "/:patientId/cases",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      return listPatientCases(patient.patientId);
    },
    { params: patientParams },
  )
  .get(
    "/:patientId/bookings",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      return listPatientBookings(patient.patientId);
    },
    { params: patientParams },
  )
  .get(
    "/:patientId/notifications",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      return listPatientNotifications(patient.patientId);
    },
    { params: patientParams },
  )
  .post(
    "/:patientId/notifications/:notificationId/read",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await markNotificationReadForPatient(
        params.notificationId,
        patient.patientId,
      );
      if (!found) throw new NotFoundError("Notification not found");
      return { ok: true };
    },
    {
      params: Type.Object({
        patientId: Type.String({ minLength: 1 }),
        notificationId: Type.String({ minLength: 1 }),
      }),
    },
  )
  .post(
    "/:patientId/devices",
    async ({ params, body, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      await registerDevice({
        patientId: patient.patientId,
        token: body.token,
        platform: body.platform,
      });
      return { ok: true };
    },
    { params: patientParams, body: DeviceTokenSchema },
  )
  .post(
    "/:patientId/events",
    async ({ params, body, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      if (body.caseId !== undefined) {
        const found = await findPatientCase(patient.patientId, body.caseId);
        if (found === null) throw new NotFoundError("Case not found");
      }
      await recordMobileEvent({
        patientId: patient.patientId,
        caseId: body.caseId ?? null,
        type: body.type,
      });
      return { ok: true };
    },
    { params: patientParams, body: MobileEventSchema },
  );
