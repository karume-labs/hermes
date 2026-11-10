import { listTeam } from "@api/features/care-loop/services/assignment-service";
import {
  requireAdmin,
  requireStaff,
  type StaffContext,
} from "@api/features/shared/auth/index";
import {
  clientAddress,
  enforceRateLimit,
} from "@api/features/shared/rate-limit";
import {
  acceptStaffInvite,
  createStaffInvite,
} from "@api/features/staff/services/staff-invite-service";
import {
  listPendingInvites,
  listStaffUsers,
  revokeStaffInvite,
  updateStaffUser,
} from "@api/features/staff/services/staff-service";
import {
  AcceptStaffInviteSchema,
  CreateStaffInviteSchema,
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
      const staff: StaffContext = await requireAdmin(headers);
      return createStaffInvite(staff, body);
    },
    { body: CreateStaffInviteSchema, headers: authHeader },
  )
  .get(
    "/invites",
    async ({ headers }) => {
      await requireAdmin(headers);
      return listPendingInvites();
    },
    { headers: authHeader },
  )
  .delete(
    "/invites/:id",
    async ({ params, headers }) => {
      await requireAdmin(headers);
      await revokeStaffInvite(params.id);
      return { ok: true };
    },
    { params: idParams, headers: authHeader },
  )
  .get(
    "/users",
    async ({ headers }) => {
      await requireAdmin(headers);
      return listStaffUsers();
    },
    { headers: authHeader },
  )
  .patch(
    "/users/:id",
    async ({ params, body, headers }) => {
      const staff = await requireAdmin(headers);
      return updateStaffUser(staff, params.id, body);
    },
    { params: idParams, body: UpdateStaffUserSchema, headers: authHeader },
  );
