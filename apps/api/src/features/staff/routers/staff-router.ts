import { listTeam } from "@api/features/care-loop/services/assignment-service";
import { requireOrgAdmin, requireStaff } from "@api/features/shared/auth/index";
import {
  clientAddress,
  enforceRateLimit,
} from "@api/features/shared/rate-limit";
import { acceptStaffInvite } from "@api/features/staff/services/staff-invite-accept-service";
import { createStaffInvite } from "@api/features/staff/services/staff-invite-service";
import {
  listPendingInvites,
  listStaffUsers,
  readNotificationChannel,
  revokeStaffInvite,
  updateNotificationChannel,
  updateStaffUser,
} from "@api/features/staff/services/staff-service";
import {
  AcceptStaffInviteSchema,
  CreateStaffInviteSchema,
  NotificationPreferencesSchema,
  UpdateStaffUserSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

const idParams = Type.Object({ id: Type.String({ minLength: 1 }) });

export const staffRouter = new Elysia({ prefix: "/staff" })
  .get(
    "/me/preferences",
    async ({ headers }) => {
      const staff = await requireStaff(headers);
      return readNotificationChannel(staff);
    },
    { headers: authHeader },
  )
  .patch(
    "/me/preferences",
    async ({ body, headers }) => {
      const staff = await requireStaff(headers);
      return updateNotificationChannel(staff, body.channel);
    },
    { body: NotificationPreferencesSchema, headers: authHeader },
  )
  .get(
    "/team",
    async ({ headers }) => {
      const staff = await requireStaff(headers);
      return listTeam(staff);
    },
    { headers: authHeader },
  )
  // Public: an invited person sets their password once.
  .post(
    "/invites/accept",
    async ({ body, request, server }) => {
      enforceRateLimit(
        `invite-accept:${clientAddress(request.headers, server, request)}`,
        10,
        60 * 60 * 1000,
      );
      return acceptStaffInvite({ token: body.token, password: body.password });
    },
    { body: AcceptStaffInviteSchema },
  )
  .post(
    "/invites",
    async ({ body, headers }) => {
      const staff = await requireOrgAdmin(headers);
      return createStaffInvite(staff, body);
    },
    { body: CreateStaffInviteSchema, headers: authHeader },
  )
  .get(
    "/invites",
    async ({ headers }) => {
      const staff = await requireOrgAdmin(headers);
      return listPendingInvites(staff);
    },
    { headers: authHeader },
  )
  .delete(
    "/invites/:id",
    async ({ params, headers }) => {
      const staff = await requireOrgAdmin(headers);
      await revokeStaffInvite(staff, params.id);
      return { ok: true };
    },
    { params: idParams, headers: authHeader },
  )
  .get(
    "/users",
    async ({ headers }) => {
      const staff = await requireOrgAdmin(headers);
      return listStaffUsers(staff);
    },
    { headers: authHeader },
  )
  .patch(
    "/users/:id",
    async ({ params, body, headers }) => {
      const staff = await requireOrgAdmin(headers);
      return updateStaffUser(staff, params.id, body);
    },
    { params: idParams, body: UpdateStaffUserSchema, headers: authHeader },
  );
