import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { CaseReferral } from "@hermes/types";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { assignCase, defaultAssigneeId } from "./assignment-service";
import { findCase, logAudit, updateCase } from "./case-repository";
import { closeTasks, ensureTask } from "./task-service";

type ReferralRow = typeof caseReferrals.$inferSelect;

const toReferral = (row: ReferralRow): CaseReferral => ({
  ...row,
  acceptedAt: row.acceptedAt?.toISOString() ?? null,
  declinedAt: row.declinedAt?.toISOString() ?? null,
  completedAt: row.completedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const activeStatuses = ["sent", "accepted"] as const;

const findReferral = async (id: string): Promise<ReferralRow | null> => {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    return null;
  const [row] = await db
    .select()
    .from(caseReferrals)
    .where(eq(caseReferrals.id, id))
    .limit(1);
  return row ?? null;
};

const assertReceivedBy = (referral: ReferralRow, staff: StaffContext): void => {
  if (staff.role !== "admin" && referral.toClinicId !== staff.clinicId) {
    throw new NotFoundError("Referral not found");
  }
};

export const createReferral = async (
  staff: StaffContext,
  input: { caseId: string; toClinicId: string; note: string },
): Promise<CaseReferral> => {
  const found = await findCase(input.caseId, staff.clinicId);
  if (found === null) throw new NotFoundError("Case not found");
  if (found.status === "closed") throw new ConflictError("Case already closed");
  if (input.toClinicId === found.clinicId) {
    throw new ConflictError("Choose a different clinic to refer to");
  }
  const [destination] = await db
    .select({ id: clinics.id, isActive: clinics.isActive })
    .from(clinics)
    .where(eq(clinics.id, input.toClinicId))
    .limit(1);
  if (destination === undefined || !destination.isActive) {
    throw new NotFoundError("Destination clinic not found");
  }
  const [active] = await db
    .select({ id: caseReferrals.id })
    .from(caseReferrals)
    .where(
      and(
        eq(caseReferrals.caseId, found.id),
        inArray(caseReferrals.status, [...activeStatuses]),
      ),
    )
    .limit(1);
  if (active !== undefined) {
    throw new ConflictError("This case already has an active referral");
  }

  const [row] = await db
    .insert(caseReferrals)
    .values({
      caseId: found.id,
      fromClinicId: found.clinicId,
      toClinicId: input.toClinicId,
      note: input.note,
      sentBy: staff.email,
    })
    .returning();
  await updateCase(found.id, {
    referralClinicId: input.toClinicId,
    status: "referred",
  });
  await ensureTask({
    caseId: found.id,
    clinicId: input.toClinicId,
    assignedToId: await defaultAssigneeId(input.toClinicId),
    kind: "referral",
    title: "Accept or decline incoming referral",
    detail: input.note,
    createdBy: staff.email,
  });
  await logAudit(found.id, `staff:${staff.email}`, "referral_sent", {
    referralId: row.id,
    toClinicId: input.toClinicId,
    note: input.note,
  });
  return toReferral(row);
};

export const listReferrals = async (
  staff: StaffContext,
  direction: "incoming" | "outgoing" | "all" = "all",
) => {
  const predicates = [];
  if (direction === "incoming" && staff.clinicId !== null)
    predicates.push(eq(caseReferrals.toClinicId, staff.clinicId));
  if (direction === "outgoing" && staff.clinicId !== null)
    predicates.push(eq(caseReferrals.fromClinicId, staff.clinicId));
  if (direction === "all" && staff.clinicId !== null) {
    predicates.push(
      or(
        eq(caseReferrals.toClinicId, staff.clinicId),
        eq(caseReferrals.fromClinicId, staff.clinicId),
      ),
    );
  }
  const rows = await db
    .select()
    .from(caseReferrals)
    .where(predicates.length === 0 ? undefined : and(...predicates))
    .orderBy(desc(caseReferrals.createdAt));
  return rows.map(toReferral);
};

export const acceptReferral = async (
  staff: StaffContext,
  id: string,
  input: { assignedToId?: string },
) => {
  const referral = await findReferral(id);
  if (referral === null) throw new NotFoundError("Referral not found");
  assertReceivedBy(referral, staff);
  if (referral.status !== "sent") {
    throw new ConflictError("Only a sent referral can be accepted");
  }
  const [row] = await db
    .update(caseReferrals)
    .set({
      status: "accepted",
      acceptedBy: staff.email,
      acceptedAt: new Date(),
    })
    .where(eq(caseReferrals.id, id))
    .returning();
  // An administrator can accept on the clinic's behalf without becoming the
  // clinical owner themselves.
  const assignedToId =
    input.assignedToId ??
    (staff.role === "admin"
      ? await defaultAssigneeId(referral.toClinicId)
      : staff.id);
  if (assignedToId !== null) {
    await assignCase(staff, referral.caseId, assignedToId);
  }
  await closeTasks(referral.caseId, ["referral"], staff.email);
  await updateCase(referral.caseId, {
    referralClinicId: referral.toClinicId,
    ...(assignedToId === null ? {} : { assignedToId }),
  });
  await logAudit(referral.caseId, `staff:${staff.email}`, "referral_accepted", {
    referralId: id,
    assignedToId: assignedToId ?? null,
  });
  return toReferral(row);
};

export const declineReferral = async (
  staff: StaffContext,
  id: string,
  reason: string | undefined,
) => {
  const referral = await findReferral(id);
  if (referral === null) throw new NotFoundError("Referral not found");
  assertReceivedBy(referral, staff);
  if (referral.status !== "sent") {
    throw new ConflictError("Only a sent referral can be declined");
  }
  if (reason === undefined || reason.trim().length < 3) {
    throw new ConflictError("Record why the referral is being declined");
  }
  const [row] = await db
    .update(caseReferrals)
    .set({
      status: "declined",
      declinedBy: staff.email,
      declinedAt: new Date(),
      declineReason: reason,
    })
    .where(eq(caseReferrals.id, id))
    .returning();
  const found = await findCase(referral.caseId);
  if (found !== null) {
    await closeTasks(referral.caseId, ["referral"], staff.email);
    await updateCase(found.id, {
      referralClinicId: null,
      status:
        found.appointmentId === null ? "acknowledged" : "appointment_booked",
    });
    await ensureTask({
      caseId: found.id,
      clinicId: found.clinicId,
      assignedToId: found.assignedToId,
      kind: "referral",
      title: "Referral declined — arrange another pathway",
      detail: reason,
      createdBy: staff.email,
    });
  }
  await logAudit(referral.caseId, `staff:${staff.email}`, "referral_declined", {
    referralId: id,
    reason,
  });
  return toReferral(row);
};

export const completeReferral = async (staff: StaffContext, id: string) => {
  const referral = await findReferral(id);
  if (referral === null) throw new NotFoundError("Referral not found");
  if (staff.role !== "admin" && referral.toClinicId !== staff.clinicId) {
    throw new NotFoundError("Referral not found");
  }
  if (referral.status !== "accepted") {
    throw new ConflictError("Accept the referral before completing it");
  }
  const [row] = await db
    .update(caseReferrals)
    .set({
      status: "completed",
      completedAt: new Date(),
      completedBy: staff.email,
    })
    .where(eq(caseReferrals.id, id))
    .returning();
  await logAudit(
    referral.caseId,
    `staff:${staff.email}`,
    "referral_completed",
    { referralId: id },
  );
  return toReferral(row);
};
