import {
  authHeader,
  idParams,
} from "@api/features/care-loop/routers/outcome-shared";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import {
  findCase,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import { ensureTask } from "@api/features/care-loop/services/task-service";
import {
  markCaseNotificationsRead,
  queueNotification,
} from "@api/features/notify/services/notification-service";
import { sendCaseMessage } from "@api/features/patient/services/message-service";
import { requirePatient } from "@api/features/patient-auth/services/patient-session-service";
import { assertCoordinator } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { AcknowledgeSchema, CaseMessageSchema } from "@hermes/validators";
import { Elysia } from "elysia";

const senderOf = (role: string): "clinician" | "coordinator" =>
  role === "clinician" ? "clinician" : "coordinator";

// Mounted under the /cases prefix by the cases router.
export const caseInteractionRoutes = new Elysia()
  .post(
    "/acknowledge",
    async ({ body, headers }) => {
      const patient = await requirePatient(headers);
      if (body.patientId !== patient.patientId)
        throw new NotFoundError("Case not found");
      const found = await findCase(body.caseId);
      if (found === null || found.patientId !== patient.patientId)
        throw new NotFoundError("Case not found");
      // Acknowledgment is idempotent: a replayed push tap must not move the
      // timestamp or reopen a closed case.
      if (found.status === "closed") return found;
      if (found.acknowledgedAt !== null) return found;

      const updated = await updateCase(found.id, {
        status: found.appointmentId === null ? "acknowledged" : found.status,
        acknowledgedAt: new Date(),
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await markCaseNotificationsRead(updated.id);
      await logAudit(
        updated.id,
        `patient:${patient.patientId}`,
        "mobile_acknowledged",
        {},
      );
      return updated;
    },
    { body: AcknowledgeSchema, headers: authHeader },
  )
  .post(
    "/:id/messages",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findCase(params.id, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      return sendCaseMessage({
        caseId: found.id,
        sender: senderOf(staff.role),
        senderId: staff.email,
        body: body.body,
      });
    },
    { params: idParams, body: CaseMessageSchema, headers: authHeader },
  )
  .post(
    "/:id/outreach",
    async ({ params, body, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findCase(params.id, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      const message = await sendCaseMessage({
        caseId: found.id,
        sender: senderOf(staff.role),
        senderId: staff.email,
        body: body.body,
      });
      await queueNotification({
        caseId: found.id,
        patientId: found.patientId,
        channel: "sms",
        kind: "sms_fallback",
        payload: {
          text: "Your care coordinator sent you a message in Hermes Care.",
          messageId: message.id,
        },
      });
      await logAudit(found.id, `staff:${staff.email}`, "outreach_triggered", {
        channel: "push+sms",
      });
      return { message, channels: ["push", "sms"] };
    },
    { params: idParams, body: CaseMessageSchema, headers: authHeader },
  )
  .post(
    "/:id/escalate",
    async ({ params, headers }) => {
      const staff = await assertCoordinator(headers);
      const found = await findCase(params.id, staff.clinicId);
      if (found === null) throw new NotFoundError("Case not found");
      const updated = await updateCase(found.id, {
        status: "escalated",
        escalatedAt: new Date(),
        assignedToId: found.assignedToId ?? staff.id,
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await queueNotification({
        caseId: updated.id,
        patientId: updated.patientId,
        channel: "in_app",
        kind: "escalation",
        payload: { reason: "coordinator_escalation" },
      });
      await ensureTask({
        caseId: updated.id,
        clinicId: updated.clinicId,
        assignedToId: updated.assignedToId,
        kind: "escalation",
        title: "Escalated case needs clinical review",
        detail: "No patient acknowledgement inside the SLA window.",
        dueAt: new Date(),
        createdBy: staff.email,
      });
      await logAudit(updated.id, `staff:${staff.email}`, "escalated", {
        reason: "manual",
      });
      return updated;
    },
    { params: idParams, headers: authHeader },
  );
