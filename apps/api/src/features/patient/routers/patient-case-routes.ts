import { defaultAssigneeId } from "@api/features/care-loop/services/assignment-service";
import {
  closeTasks,
  ensureTask,
} from "@api/features/care-loop/services/task-service";
import { listNotifications } from "@api/features/notify/services/notification-service";
import {
  caseParams,
  patientFrom,
} from "@api/features/patient/routers/patient-guard";
import { recordMobileEvent } from "@api/features/patient/services/patient-device-service";
import {
  findCaseFeedback,
  saveCaseFeedback,
} from "@api/features/patient/services/patient-feedback";
import {
  findPatientCase,
  listMessages,
  markInboundMessagesRead,
} from "@api/features/patient/services/patient-repository";
import { NotFoundError } from "@api/features/shared/errors/index";
import { CaseFeedbackSchema, MobileEventSchema } from "@hermes/validators";
import { Elysia } from "elysia";

export const patientCaseRoutes = new Elysia({ prefix: "/patients" })
  .get(
    "/:patientId/cases/:caseId",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await findPatientCase(patient.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      return {
        ...found,
        messages: await listMessages(found.careCase.id),
        notifications: await listNotifications(found.careCase.id),
        feedback: await findCaseFeedback(found.careCase.id),
      };
    },
    { params: caseParams },
  )
  .post(
    "/:patientId/cases/:caseId/feedback",
    async ({ params, body, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await findPatientCase(patient.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      const feedback = await saveCaseFeedback({
        caseId: found.careCase.id,
        patientId: patient.patientId,
        understood: body.understood,
        confidence: body.confidence,
        comment: body.comment,
      });
      // Teach-back is only useful if it changes the care team's work: a
      // negative answer opens a staff follow-up, a positive one closes it.
      if (body.understood) {
        await closeTasks(
          found.careCase.id,
          ["patient_followup"],
          `patient:${patient.patientId}`,
        );
      } else {
        const owner =
          found.careCase.assignedToId ??
          (await defaultAssigneeId(found.careCase.clinicId));
        await ensureTask({
          caseId: found.careCase.id,
          clinicId: found.careCase.clinicId,
          assignedToId: owner,
          kind: "patient_followup",
          title: "Patient did not understand their result",
          detail: body.comment ?? "Patient answered that they still need help.",
          dueAt: new Date(),
          createdBy: `patient:${patient.patientId}`,
        });
      }
      await recordMobileEvent({
        patientId: patient.patientId,
        caseId: found.careCase.id,
        type: "case_viewed",
      });
      return feedback;
    },
    { params: caseParams, body: CaseFeedbackSchema },
  )
  .post(
    "/:patientId/cases/:caseId/read",
    async ({ params, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await findPatientCase(patient.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      await markInboundMessagesRead(found.careCase.id, "patient");
      return { ok: true };
    },
    { params: caseParams },
  )
  .post(
    "/:patientId/cases/:caseId/events",
    async ({ params, body, headers }) => {
      const patient = await patientFrom(headers, params.patientId);
      const found = await findPatientCase(patient.patientId, params.caseId);
      if (found === null) throw new NotFoundError("Case not found");
      await recordMobileEvent({
        patientId: patient.patientId,
        caseId: found.careCase.id,
        type: body.type,
      });
      return { ok: true };
    },
    { params: caseParams, body: MobileEventSchema },
  );
