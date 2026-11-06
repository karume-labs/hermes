import {
  findCase,
  isCaseId,
} from "@api/features/care-loop/services/case-repository";
import {
  dispatchPending,
  listNotifications,
  listPatientNotifications,
  listRecentNotifications,
  listWebhookLogs,
  notificationStats,
} from "@api/features/notify/services/notification-service";
import { requireAdmin, requireStaff } from "@api/features/shared/auth/index";
import { ForbiddenError } from "@api/features/shared/errors/index";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const notifyRouter = new Elysia({ prefix: "/notifications" })
  .get(
    "/",
    async ({ query, headers }) => {
      const staff = await requireStaff(headers);
      if (query.patientId !== undefined) {
        // Patient-wide views can span clinics; only admins may ask for them.
        if (staff.role !== "admin") throw new ForbiddenError();
        return listPatientNotifications(query.patientId);
      }
      if (query.caseId === undefined) {
        return listRecentNotifications(50, staff.clinicId);
      }
      if (!isCaseId(query.caseId)) return [];
      const found = await findCase(query.caseId, staff.clinicId);
      if (found === null) return [];
      return listNotifications(found.id);
    },
    {
      query: Type.Object({
        caseId: Type.Optional(Type.String()),
        patientId: Type.Optional(Type.String()),
      }),
      headers: authHeader,
    },
  )
  .get(
    "/stats",
    async ({ headers }) => {
      const staff = await requireStaff(headers);
      return notificationStats(staff.clinicId);
    },
    { headers: authHeader },
  )
  .post(
    "/dispatch",
    async ({ headers, set }) => {
      await requireStaff(headers);
      const delivered = await dispatchPending();
      set.status = 202;
      return { delivered };
    },
    { headers: authHeader },
  );

export const webhookLogRouter = new Elysia().get(
  "/webhooks/logs",
  async ({ headers }) => {
    await requireAdmin(headers);
    return listWebhookLogs();
  },
  { headers: authHeader },
);
