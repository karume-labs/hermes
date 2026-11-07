import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { StaffContext } from "@api/features/shared/auth/index";
import { env } from "@api/features/shared/env/index";
import {
  ConflictError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { assertClinic } from "@api/features/staff/services/staff-service";
import { account, staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import type { StaffRole } from "@hermes/types";
import type { CreateStaffInvite } from "@hermes/validators";
import { hashPassword } from "better-auth/crypto";
import { and, eq, isNull } from "drizzle-orm";

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
