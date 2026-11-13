import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { StaffRole } from "@hermes/types";
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
export const organizationFilter = (actor: StaffContext): string | null =>
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

export const assertCanManage = (
  actor: StaffContext,
  targetRole: StaffRole,
): void => {
  if (actor.role === "admin") return;
  if (targetRole === "admin" || targetRole === "org_admin") {
    throw new ForbiddenError("Only the platform operator can grant admin.");
  }
};
