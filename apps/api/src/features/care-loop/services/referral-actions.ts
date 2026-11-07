import {
  assignCase,
  defaultAssigneeId,
} from "@api/features/care-loop/services/assignment-service";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import {
  findCase,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import { toReferral } from "@api/features/care-loop/services/referral-dto";
import {
  assertReceivedBy,
  findReferral,
} from "@api/features/care-loop/services/referral-repository";
import {
  closeTasks,
  ensureTask,
} from "@api/features/care-loop/services/task-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { eq } from "drizzle-orm";

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
    assignedToId: assignedToId,
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
