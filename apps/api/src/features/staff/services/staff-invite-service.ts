import { createHash, randomBytes, randomUUID } from "node:crypto";
import { assertOrgClinic } from "@api/features/organization/services/organization-clinic-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import { env } from "@api/features/shared/env/index";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { sendStaffInviteEmail } from "@api/features/shared/mail/index";
import { assertClinic } from "@api/features/staff/services/staff-service";
import { account, staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { organizations } from "@db/directory/schema/index";
import type { StaffRole } from "@hermes/types";
import type { CreateStaffInvite } from "@hermes/validators";
import { hashPassword } from "better-auth/crypto";
import { and, eq, isNull } from "drizzle-orm";

const INVITE_DAYS = 7;

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const roleLabel = (role: StaffRole): string => role.replaceAll("_", " ");

export interface StaffInviteResult {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  clinicId: string | null;
  organizationId: string | null;
  expiresAt: string;
  token: string;
  inviteUrl: string;
  emailSent: boolean;
}

export const createStaffInvite = async (
  staff: StaffContext,
  input: CreateStaffInvite,
): Promise<StaffInviteResult> => {
  const email = input.email.trim().toLowerCase();
  const clinicId = input.clinicId ?? null;
  // The session decides the organization; only the platform operator may name
  // one explicitly, which is how the first org admin is created.
  const organizationId =
    staff.role === "admin"
      ? (input.organizationId ?? null)
      : (staff.organizationId ?? null);
  if (organizationId === null) {
    throw new ConflictError("Choose the organization this person joins.");
  }
  if (
    staff.role !== "admin" &&
    (input.role === "admin" || input.role === "org_admin")
  ) {
    throw new ForbiddenError("Only the platform operator can grant admin.");
  }
  if (
    (input.role === "coordinator" || input.role === "clinician") &&
    clinicId === null
  ) {
    throw new ConflictError("Coordinators and clinicians need a clinic.");
  }
  await assertClinic(clinicId);
  await assertOrgClinic(organizationId, clinicId);

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
      organizationId,
      tokenHash: hashToken(token),
      expiresAt,
      createdBy: staff.email,
    })
    .returning();

  const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${encodeURIComponent(token)}`;
  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  // A failed send must not lose the invite: the admin still gets the link and
  // can pass it on, and the attempt is recorded in the email log.
  const emailSent = await sendStaffInviteEmail({
    to: email,
    name: input.name,
    role: roleLabel(input.role),
    organizationName: organization?.name ?? "Your organization",
    inviteUrl,
  }).then(
    () => true,
    () => false,
  );

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    clinicId: row.clinicId,
    organizationId: row.organizationId,
    expiresAt: row.expiresAt.toISOString(),
    token,
    inviteUrl,
    emailSent,
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
      organizationId: invite.organizationId,
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
