import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { StaffContext } from "@api/features/shared/auth/index";
import { env } from "@api/features/shared/env/index";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { account, session, staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { StaffRole } from "@hermes/types";
import type { CreateStaffInvite, UpdateStaffUser } from "@hermes/validators";
import { hashPassword } from "better-auth/crypto";
import { and, desc, eq, isNull } from "drizzle-orm";

const INVITE_DAYS = 7;

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export interface StaffInviteResult {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  clinicId: string | null;
  expiresAt: string;
  token: string;
  inviteUrl: string;
}

const assertClinic = async (clinicId: string | null): Promise<void> => {
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

export const createStaffInvite = async (
  staff: StaffContext,
  input: CreateStaffInvite,
): Promise<StaffInviteResult> => {
  const email = input.email.trim().toLowerCase();
  const clinicId = input.clinicId ?? null;
  if (input.role === "coordinator" && clinicId === null) {
    throw new ConflictError("Coordinators need a clinic.");
  }
  await assertClinic(clinicId);

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing !== undefined) {
    throw new ConflictError("That email already has an account.");
  }

  // A fresh invite supersedes any pending one for the same address.
  await db
    .delete(staffInvites)
    .where(and(eq(staffInvites.email, email), isNull(staffInvites.acceptedAt)));

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(staffInvites)
    .values({
      email,
      name: input.name,
      role: input.role,
      clinicId,
      tokenHash: hashToken(token),
      expiresAt,
      createdBy: staff.email,
    })
    .returning();

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    clinicId: row.clinicId,
    expiresAt: row.expiresAt.toISOString(),
    token,
    inviteUrl: `${env.FRONTEND_URL}/accept-invite?token=${encodeURIComponent(token)}`,
  };
};

export interface AcceptInviteInput {
  token: string;
  password: string;
}

export const acceptStaffInvite = async (
  input: AcceptInviteInput,
): Promise<{ email: string }> => {
  const [invite] = await db
    .select()
    .from(staffInvites)
    .where(eq(staffInvites.tokenHash, hashToken(input.token)))
    .limit(1);
  if (invite === undefined) throw new UnauthorizedError("Invite is not valid.");
  if (invite.acceptedAt !== null) {
    throw new ConflictError("This invite has already been used.");
  }
  if (invite.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError("This invite has expired.");
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, invite.email))
    .limit(1);
  if (existing !== undefined) {
    throw new ConflictError("That email already has an account.");
  }

  const userId = randomUUID();
  const password = await hashPassword(input.password);
  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: invite.name,
      email: invite.email,
      emailVerified: true,
      role: invite.role,
      clinicId: invite.clinicId,
    });
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    });
    await tx
      .update(staffInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(staffInvites.id, invite.id));
  });

  return { email: invite.email };
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

  const [clinic] = await db
    .select({ name: clinics.name })
    .from(clinics)
    .where(eq(clinics.id, updated.clinicId ?? ""))
    .limit(1);
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    clinicId: updated.clinicId,
    clinicName: clinic?.name ?? null,
    banned: updated.banned ?? false,
    createdAt: updated.createdAt.toISOString(),
  };
};
