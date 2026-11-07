import {
  caseParams,
  patientFrom,
} from "@api/features/patient/routers/patient-guard";
import { sendCaseMessage } from "@api/features/patient/services/message-service";
import {
  findPatientCase,
  listMessages,
  markInboundMessagesRead,
} from "@api/features/patient/services/patient-repository";
import { NotFoundError } from "@api/features/shared/errors/index";
import { CaseMessageSchema } from "@hermes/validators";
import { Elysia } from "elysia";

export const patientMessageRoutes = new Elysia({ prefix: "/patients" })
  .get(
    "/:patientId/cases/:caseId/messages",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await findPatientCase(patient.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      return listMessages(found.careCase.id);
    },
    { params: caseParams },
  )
  .post(
    "/:patientId/cases/:caseId/messages",
    async ({ params, body, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await findPatientCase(patient.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      await markInboundMessagesRead(found.careCase.id, "patient");
      return sendCaseMessage({
        caseId: found.careCase.id,
        sender: "patient",
        senderId: patient.patientId,
        body: body.body,
      });
    },
    { params: caseParams, body: CaseMessageSchema },
  );
