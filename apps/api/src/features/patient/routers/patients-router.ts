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
import {
  type PatientContext,
  requirePatient,
} from "@api/features/patient-auth/services/patient-auth-service";
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

// The session decides who the patient is; the path segment only has to match
// it. A mismatch is reported as 404 so ids cannot be probed.
const assertOwnPath = (
  pathPatientId: string,
  context: PatientContext,
): void => {
  if (pathPatientId !== context.patientId) {
    throw new NotFoundError("Patient not found");
  }
};

export const patientsRouter = new Elysia({ prefix: "/patients" })
  .derive(async ({ headers }) => ({
    patientContext: await requirePatient(headers),
  }))
  .onBeforeHandle(({ params, patientContext }) => {
    if ("patientId" in params && typeof params.patientId === "string") {
      assertOwnPath(params.patientId, patientContext);
    }
  })
  .get(
    "/:patientId/cases",
    ({ patientContext }) => listPatientCases(patientContext.patientId),
    { params: patientParams },
  )
  .get(
    "/:patientId/cases/:caseId",
    async ({ params, patientContext }) => {
      const found = await findPatientCase(
        patientContext.patientId,
        params.caseId,
      );
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
    async ({ params, patientContext }) => {
      const found = await findPatientCase(
        patientContext.patientId,
        params.caseId,
      );
      if (found === null) throw new NotFoundError("Case not found");
      await markInboundMessagesRead(found.careCase.id, "patient");
      return { ok: true };
    },
    { params: caseParams },
  )
  .get(
    "/:patientId/cases/:caseId/messages",
    async ({ params, patientContext }) => {
      const found = await findPatientCase(
        patientContext.patientId,
        params.caseId,
      );
      if (found === null) throw new NotFoundError("Case not found");
      return listMessages(found.careCase.id);
    },
    { params: caseParams },
  )
  .post(
    "/:patientId/cases/:caseId/messages",
    async ({ params, body, patientContext }) => {
      const found = await findPatientCase(
        patientContext.patientId,
        params.caseId,
      );
      if (found === null) throw new NotFoundError("Case not found");
      await markInboundMessagesRead(found.careCase.id, "patient");
      return sendCaseMessage({
        caseId: found.careCase.id,
        sender: "patient",
        senderId: patientContext.patientId,
        body: body.body,
      });
    },
    { params: caseParams, body: CaseMessageSchema },
  )
  .post(
    "/:patientId/cases/:caseId/events",
    async ({ params, body, patientContext }) => {
      const found = await findPatientCase(
        patientContext.patientId,
        params.caseId,
      );
      if (found === null) throw new NotFoundError("Case not found");
      await recordMobileEvent({
        patientId: patientContext.patientId,
        caseId: found.careCase.id,
        type: body.type,
      });
      return { ok: true };
    },
    { params: caseParams, body: MobileEventSchema },
  )
  .get(
    "/:patientId/notifications",
    ({ patientContext }) => listPatientNotifications(patientContext.patientId),
    { params: patientParams },
  )
  .post(
    "/:patientId/notifications/:notificationId/read",
    async ({ params, patientContext }) => {
      const found = await markNotificationReadForPatient(
        params.notificationId,
        patientContext.patientId,
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
    async ({ body, patientContext }) => {
      await registerDevice({
        patientId: patientContext.patientId,
        token: body.token,
        platform: body.platform,
      });
      return { ok: true };
    },
    { params: patientParams, body: DeviceTokenSchema },
  )
  .post(
    "/:patientId/events",
    async ({ body, patientContext }) => {
      if (body.caseId !== undefined) {
        const found = await findPatientCase(
          patientContext.patientId,
          body.caseId,
        );
        if (found === null) throw new NotFoundError("Case not found");
      }
      await recordMobileEvent({
        patientId: patientContext.patientId,
        caseId: body.caseId ?? null,
        type: body.type,
      });
      return { ok: true };
    },
    { params: patientParams, body: MobileEventSchema },
  );
