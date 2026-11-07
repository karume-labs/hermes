import { defaultAssigneeId } from "@api/features/care-loop/services/assignment-service";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import {
  findCase,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import {
  activeStatuses,
  toReferral,
} from "@api/features/care-loop/services/referral-dto";
import { ensureTask } from "@api/features/care-loop/services/task-service";
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
