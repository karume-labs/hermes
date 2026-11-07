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
import { desc, eq, isNull } from "drizzle-orm";

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
  banned: boolean;
  createdAt: string;
}

export const listStaffUsers = async (): Promise<StaffUserView[]> => {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: clinics.name,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(clinics, eq(user.clinicId, clinics.id))
    .orderBy(desc(user.createdAt));
  return rows.map((row) => ({
    ...row,
    banned: row.banned ?? false,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const listPendingInvites = async () => {
  const rows = await db
    .select({
      id: staffInvites.id,
      email: staffInvites.email,
      name: staffInvites.name,
      role: staffInvites.role,
      clinicId: staffInvites.clinicId,
      expiresAt: staffInvites.expiresAt,
      createdAt: staffInvites.createdAt,
    })
    .from(staffInvites)
    .where(isNull(staffInvites.acceptedAt))
    .orderBy(desc(staffInvites.createdAt));
  return rows.map((row) => ({
    ...row,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
};

export const revokeStaffInvite = async (id: string): Promise<void> => {
  const rows = await db
    .delete(staffInvites)
    .where(eq(staffInvites.id, id))
    .returning({ id: staffInvites.id });
  if (rows.length === 0) throw new NotFoundError("Invite not found");
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
    .select({ role: user.role, clinicId: user.clinicId })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (target === undefined) throw new NotFoundError("Staff member not found");

  const nextRole = input.role ?? target.role;
  const nextClinic =
    input.clinicId === undefined ? target.clinicId : input.clinicId;
  if (nextRole === "coordinator" && nextClinic === null) {
    throw new ConflictError("Coordinators need a clinic.");
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
    banned: updated.banned ?? false,
    createdAt: updated.createdAt.toISOString(),
  };
};
