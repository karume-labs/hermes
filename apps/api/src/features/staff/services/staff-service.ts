import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { session, staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { StaffRole } from "@hermes/types";
import type { UpdateStaffUser } from "@hermes/validators";
import { and, desc, eq, isNull } from "drizzle-orm";

export const assertClinic = async (clinicId: string | null): Promise<void> => {
  if (clinicId === null) return;
  const [clinic] = await db
    .select({ id: clinics.id, isActive: clinics.isActive })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);
  if (clinic === undefined || !clinic.isActive) {
    throw new NotFoundError("Clinic not found");
  }
};

export interface StaffUserView {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  clinicId: string | null;
  clinicName: string | null;
  organizationId: string | null;
  banned: boolean;
  createdAt: string;
}

/**
 * Org admins see their own organization; the platform admin sees everyone.
 * The organization is taken from the session, never from the request.
 */
const organizationFilter = (actor: StaffContext): string | null =>
  actor.role === "org_admin" ? actor.organizationId : null;

export const listStaffUsers = async (
  actor: StaffContext,
): Promise<StaffUserView[]> => {
  const organizationId = organizationFilter(actor);
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: clinics.name,
      organizationId: user.organizationId,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(clinics, eq(user.clinicId, clinics.id))
    .where(
      organizationId === null
        ? undefined
        : eq(user.organizationId, organizationId),
    )
    .orderBy(desc(user.createdAt));
  return rows.map((row) => ({
    ...row,
    banned: row.banned ?? false,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const listPendingInvites = async (actor: StaffContext) => {
  const organizationId = organizationFilter(actor);
  const rows = await db
    .select({
      id: staffInvites.id,
      email: staffInvites.email,
      name: staffInvites.name,
      role: staffInvites.role,
      clinicId: staffInvites.clinicId,
      organizationId: staffInvites.organizationId,
      expiresAt: staffInvites.expiresAt,
      createdAt: staffInvites.createdAt,
    })
    .from(staffInvites)
    .where(
      and(
        isNull(staffInvites.acceptedAt),
        organizationId === null
          ? undefined
          : eq(staffInvites.organizationId, organizationId),
      ),
    )
    .orderBy(desc(staffInvites.createdAt));
  return rows.map((row) => ({
    ...row,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
};

export const revokeStaffInvite = async (
  actor: StaffContext,
  id: string,
): Promise<void> => {
  const organizationId = organizationFilter(actor);
  const rows = await db
    .delete(staffInvites)
    .where(
      and(
        eq(staffInvites.id, id),
        organizationId === null
          ? undefined
          : eq(staffInvites.organizationId, organizationId),
      ),
    )
    .returning({ id: staffInvites.id });
  if (rows.length === 0) throw new NotFoundError("Invite not found");
};

const assertCanManage = (actor: StaffContext, targetRole: StaffRole): void => {
  if (actor.role === "admin") return;
  if (targetRole === "admin" || targetRole === "org_admin") {
    throw new ForbiddenError("Only the platform operator can grant admin.");
  }
};

// How a staff member wants their own alerts. Not an access change, so it does
// not invalidate the session.
export const updateNotificationChannel = async (
  staff: StaffContext,
  channel: "email" | "in_app" | "both",
): Promise<{ channel: "email" | "in_app" | "both" }> => {
  const [row] = await db
    .update(user)
    .set({ notificationChannel: channel })
    .where(eq(user.id, staff.id))
    .returning({ channel: user.notificationChannel });
  if (row === undefined) throw new NotFoundError("Staff member not found");
  return row;
};

export const updateStaffUser = async (
  actor: StaffContext,
  id: string,
  input: UpdateStaffUser,
): Promise<StaffUserView> => {
  if (id === actor.id && (input.role !== undefined || input.banned === true)) {
    throw new ForbiddenError("You cannot change your own access.");
  }
  const [target] = await db
    .select({
      role: user.role,
      clinicId: user.clinicId,
      organizationId: user.organizationId,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (target === undefined) throw new NotFoundError("Staff member not found");
  if (
    actor.role === "org_admin" &&
    (target.organizationId !== actor.organizationId ||
      target.role === "admin" ||
      target.role === "org_admin")
  ) {
    throw new NotFoundError("Staff member not found");
  }

  const nextRole = input.role ?? target.role;
  const nextClinic =
    input.clinicId === undefined ? target.clinicId : input.clinicId;
  assertCanManage(actor, nextRole);
  if (
    (nextRole === "coordinator" || nextRole === "clinician") &&
    nextClinic === null
  ) {
    throw new ConflictError("Coordinators and clinicians need a clinic.");
  }
  await assertClinic(nextClinic);

  const [updated] = await db
    .update(user)
    .set({
      ...(input.role === undefined ? {} : { role: input.role }),
      ...(input.clinicId === undefined ? {} : { clinicId: input.clinicId }),
      ...(input.banned === undefined ? {} : { banned: input.banned }),
      ...(input.banReason === undefined ? {} : { banReason: input.banReason }),
    })
    .where(eq(user.id, id))
    .returning();
  if (updated === undefined) throw new NotFoundError("Staff member not found");

  // Role, clinic and ban changes must take effect immediately.
  await db.delete(session).where(eq(session.userId, id));

  const [clinic] =
    updated.clinicId === null
      ? [undefined]
      : await db
          .select({ name: clinics.name })
          .from(clinics)
          .where(eq(clinics.id, updated.clinicId))
          .limit(1);
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    clinicId: updated.clinicId,
    clinicName: clinic === undefined ? null : clinic.name,
    organizationId: updated.organizationId,
    banned: updated.banned ?? false,
    createdAt: updated.createdAt.toISOString(),
  };
};
