import { user } from "@db/auth/schema/index";
import { caseClinicians } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { CaseAccess, CaseParticipant } from "@hermes/types";
import { and, asc, eq, isNull } from "drizzle-orm";

export const ensureParticipant = async (input: {
  caseId: string;
  userId: string;
  clinicId: string;
  access: CaseAccess;
  grantedBy: string;
}): Promise<void> => {
  await db
    .insert(caseClinicians)
    .values({
      caseId: input.caseId,
      userId: input.userId,
      clinicId: input.clinicId,
      access: input.access,
      grantedBy: input.grantedBy,
    })
    .onConflictDoUpdate({
      target: [caseClinicians.caseId, caseClinicians.userId],
      set: {
        access: input.access,
        clinicId: input.clinicId,
        grantedBy: input.grantedBy,
        revokedAt: null,
      },
    });
};

export const listParticipants = async (
  caseId: string,
): Promise<CaseParticipant[]> => {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: clinics.name,
      access: caseClinicians.access,
      grantedAt: caseClinicians.grantedAt,
    })
    .from(caseClinicians)
    .innerJoin(user, eq(caseClinicians.userId, user.id))
    .leftJoin(clinics, eq(caseClinicians.clinicId, clinics.id))
    .where(
      and(eq(caseClinicians.caseId, caseId), isNull(caseClinicians.revokedAt)),
    )
    .orderBy(asc(caseClinicians.grantedAt));
  return rows.map((row) => ({
    ...row,
    grantedAt: row.grantedAt.toISOString(),
  }));
};

export const setParticipantAccess = async (input: {
  caseId: string;
  userId: string;
  access: Extract<CaseAccess, "collaborator" | "read">;
}): Promise<boolean> => {
  const [row] = await db
    .update(caseClinicians)
    .set({ access: input.access })
    .where(
      and(
        eq(caseClinicians.caseId, input.caseId),
        eq(caseClinicians.userId, input.userId),
        isNull(caseClinicians.revokedAt),
      ),
    )
    .returning({ id: caseClinicians.id });
  return row !== undefined;
};

export const revokeParticipant = async (
  caseId: string,
  userId: string,
): Promise<boolean> => {
  const [row] = await db
    .update(caseClinicians)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(caseClinicians.caseId, caseId),
        eq(caseClinicians.userId, userId),
        isNull(caseClinicians.revokedAt),
      ),
    )
    .returning({ id: caseClinicians.id });
  return row !== undefined;
};
