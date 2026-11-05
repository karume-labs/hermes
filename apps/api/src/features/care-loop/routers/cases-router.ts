import { getCaseDetail } from "@api/features/care-loop/services/case-detail";
import {
  findCase,
  listCases,
  logAudit,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import {
  markCaseNotificationsRead,
  queueNotification,
} from "@api/features/notify/services/notification-service";
import { sendCaseMessage } from "@api/features/patient/services/message-service";
import { listMessages } from "@api/features/patient/services/patient-repository";
import { assertCoordinator } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { AcknowledgeSchema, CaseMessageSchema } from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const listQuery = Type.Object({
  severity: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
});

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const casesRouter = new Elysia({ prefix: "/cases" })
  .get("/", ({ query }) => listCases(query), { query: listQuery })
  .get("/:id", async ({ params }) => {
    const detail = await getCaseDetail(params.id);
    if (detail === null) throw new NotFoundError("Case not found");
    return detail;
  })
  .get("/:id/messages", async ({ params }) => {
    const found = await findCase(params.id);
    if (found === null) throw new NotFoundError("Case not found");
    return listMessages(found.id);
  })
  .post(
    "/acknowledge",
    async ({ body }) => {
      const found = await findCase(body.caseId);
      if (found === null || found.patientId !== body.patientId)
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
        `patient:${body.patientId}`,
        "mobile_acknowledged",
        {},
      );
      return updated;
    },
    { body: AcknowledgeSchema },
  )
  .post(
    "/:id/messages",
    async ({ params, body, headers }) => {
      await assertCoordinator(headers);
      const found = await findCase(params.id);
      if (found === null) throw new NotFoundError("Case not found");
      return sendCaseMessage({
        caseId: found.id,
        sender: "coordinator",
        senderId: body.senderId ?? "coordinator",
        body: body.body,
      });
    },
    { body: CaseMessageSchema, headers: authHeader },
  )
  .post(
    "/:id/outreach",
    async ({ params, body, headers }) => {
      await assertCoordinator(headers);
      const found = await findCase(params.id);
      if (found === null) throw new NotFoundError("Case not found");
      const message = await sendCaseMessage({
        caseId: found.id,
        sender: "coordinator",
        senderId: body.senderId ?? "coordinator",
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
      await logAudit(found.id, "coordinator", "outreach_triggered", {
        channel: "push+sms",
      });
      return { message, channels: ["push", "sms"] };
    },
    { body: CaseMessageSchema, headers: authHeader },
  )
  .post(
    "/:id/escalate",
    async ({ params, headers }) => {
      await assertCoordinator(headers);
      const found = await findCase(params.id);
      if (found === null) throw new NotFoundError("Case not found");
      const updated = await updateCase(found.id, {
        status: "escalated",
        escalatedAt: new Date(),
      });
      if (updated === null) throw new NotFoundError("Case not found");
      await queueNotification({
        caseId: updated.id,
        patientId: updated.patientId,
        channel: "in_app",
        kind: "escalation",
        payload: { reason: "coordinator_escalation" },
      });
      await logAudit(updated.id, "coordinator", "escalated", {
        reason: "manual",
      });
      return updated;
    },
    { headers: authHeader },
  );
