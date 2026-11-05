import { isCaseId } from "@api/features/care-loop/services/case-repository";
import {
  dispatchPending,
  listNotifications,
  listPatientNotifications,
  listRecentNotifications,
  listWebhookLogs,
  notificationStats,
} from "@api/features/notify/services/notification-service";
import { assertCoordinator } from "@api/features/shared/auth/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const notifyRouter = new Elysia({ prefix: "/notifications" })
  .get(
    "/",
    async ({ query }) => {
      if (query.patientId !== undefined)
        return listPatientNotifications(query.patientId);
      if (query.caseId === undefined) return listRecentNotifications();
      if (!isCaseId(query.caseId)) return [];
      return listNotifications(query.caseId);
    },
    {
      query: Type.Object({
        caseId: Type.Optional(Type.String()),
        patientId: Type.Optional(Type.String()),
      }),
    },
  )
  .get("/stats", () => notificationStats())
  .post(
    "/dispatch",
    async ({ headers, set }) => {
      await assertCoordinator(headers);
      const delivered = await dispatchPending();
      set.status = 202;
      return { delivered };
    },
    { headers: authHeader },
  );

export const webhookLogRouter = new Elysia().get("/webhooks/logs", async () =>
  listWebhookLogs(),
);
