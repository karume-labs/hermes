import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import type { StaffUserView } from "@api/features/staff/services/staff-query";
import {
  assertCanManage,
  assertClinic,
} from "@api/features/staff/services/staff-query";
import { session, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { UpdateStaffUser } from "@hermes/validators";
import { eq } from "drizzle-orm";

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
