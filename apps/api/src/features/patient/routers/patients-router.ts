import {
  listNotifications,
  listPatientNotifications,
  markNotificationReadForPatient,
} from "@api/features/notify/services/notification-service";
import { sendCaseMessage } from "@api/features/patient/services/message-service";
import {
  findPatientCase,
  listMessages,
  listPatientCases,
  markInboundMessagesRead,
  recordMobileEvent,
  registerDevice,
} from "@api/features/patient/services/patient-repository";
import { NotFoundError } from "@api/features/shared/errors/index";
import {
  CaseMessageSchema,
  DeviceTokenSchema,
  MobileEventSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const patientParams = Type.Object({ patientId: Type.String({ minLength: 1 }) });
const caseParams = Type.Object({
  patientId: Type.String({ minLength: 1 }),
  caseId: Type.String({ minLength: 1 }),
});

export const patientsRouter = new Elysia({ prefix: "/patients" })
  .get(
    "/:patientId/cases",
    ({ params }) => listPatientCases(params.patientId),
    { params: patientParams },
  )
  .get(
    "/:patientId/cases/:caseId",
    async ({ params }) => {
      const found = await findPatientCase(params.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      return {
        ...found,
        messages: await listMessages(found.careCase.id),
        notifications: await listNotifications(found.careCase.id),
      };
    },
    { params: caseParams },
  )
  .post(
    "/:patientId/cases/:caseId/read",
    async ({ params }) => {
      const found = await findPatientCase(params.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      await markInboundMessagesRead(found.careCase.id, "patient");
      return { ok: true };
    },
    { params: caseParams },
  )
  .get(
    "/:patientId/cases/:caseId/messages",
    async ({ params }) => {
      const found = await findPatientCase(params.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      return listMessages(found.careCase.id);
    },
    { params: caseParams },
  )
  .post(
    "/:patientId/cases/:caseId/messages",
    async ({ params, body }) => {
      const found = await findPatientCase(params.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      await markInboundMessagesRead(found.careCase.id, "patient");
      return sendCaseMessage({
        caseId: found.careCase.id,
        sender: "patient",
        senderId: params.patientId,
        body: body.body,
      });
    },
    { params: caseParams, body: CaseMessageSchema },
  )
  .post(
    "/:patientId/cases/:caseId/events",
    async ({ params, body }) => {
      const found = await findPatientCase(params.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      await recordMobileEvent({
        patientId: params.patientId,
        caseId: found.careCase.id,
        type: body.type,
      });
      return { ok: true };
    },
    { params: caseParams, body: MobileEventSchema },
  )
  .get(
    "/:patientId/notifications",
    ({ params }) => listPatientNotifications(params.patientId),
    { params: patientParams },
  )
  .post(
    "/:patientId/notifications/:notificationId/read",
    async ({ params }) => {
      const found = await markNotificationReadForPatient(
        params.notificationId,
        params.patientId,
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
    async ({ params, body }) => {
      await registerDevice({
        patientId: params.patientId,
        token: body.token,
        platform: body.platform,
      });
      return { ok: true };
    },
    { params: patientParams, body: DeviceTokenSchema },
  )
  .post(
    "/:patientId/events",
    async ({ params, body }) => {
      if (body.caseId !== undefined) {
        const found = await findPatientCase(params.patientId, body.caseId);
        if (found === null) throw new NotFoundError("Case not found");
      }
      await recordMobileEvent({
        patientId: params.patientId,
        caseId: body.caseId ?? null,
        type: body.type,
      });
      return { ok: true };
    },
    { params: patientParams, body: MobileEventSchema },
  );
