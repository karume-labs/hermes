import { randomUUID } from "node:crypto";
import {
  ConflictError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { hashInviteToken } from "@api/features/staff/services/staff-invite-token";
import { account, staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

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
    .where(eq(staffInvites.tokenHash, hashInviteToken(input.token)))
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
