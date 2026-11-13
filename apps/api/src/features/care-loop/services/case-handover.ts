import { logAudit } from "@api/features/care-loop/services/case-audit";
import {
  findCase,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import {
  clinicOf,
  findTarget,
} from "@api/features/care-loop/services/handover-target";
import {
  ensureParticipant,
  listParticipants,
  setParticipantAccess,
} from "@api/features/care-loop/services/participants-service";
import {
  closeTasks,
  ensureTask,
} from "@api/features/care-loop/services/task-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { sendStaffAlertEmail } from "@api/features/shared/mail/index";
import { caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CareCase, CaseParticipant } from "@hermes/types";

/**
 * Clinician-to-clinician hand-over. The receiving clinician becomes the named
 * owner; the sender keeps a read-only seat so the case history stays
 * continuous for the person who was treating the patient.
 */
export const handoverCase = async (
  staff: StaffContext,
  caseId: string,
  input: { toUserId: string; note: string },
): Promise<{ careCase: CareCase; clinicians: CaseParticipant[] }> => {
  const found = await findCase(caseId, {
    clinicId: staff.clinicId,
    organizationId: staff.organizationId,
    userId: staff.id,
  });
  if (found === null) throw new NotFoundError("Case not found");
  if (found.status === "closed") throw new ConflictError("Case already closed");

  const target = await findTarget(input.toUserId);
  if (target === null) throw new NotFoundError("Clinician not found");
  if (target.id === staff.id) {
    throw new ConflictError("That clinician already owns this case.");
  }
  if (target.role !== "clinician" && target.role !== "coordinator") {
    throw new ConflictError("Choose a clinician from this care team.");
  }
  const sameClinic = target.clinicId === found.clinicId;
  const sameOrganization =
    staff.organizationId !== null &&
    staff.organizationId === target.organizationId;
  if (!sameClinic && !sameOrganization) {
    throw new ConflictError("That clinician is outside this case's care team.");
  }
  const toClinicId = target.clinicId ?? found.clinicId;

  await db.insert(caseReferrals).values({
    caseId: found.id,
    fromClinicId: found.clinicId,
    toClinicId,
    fromUserId: staff.id,
    toUserId: target.id,
    note: input.note,
    status: "accepted",
    sentBy: staff.email,
    acceptedBy: target.email,
    acceptedAt: new Date(),
  });

  // The previous owner keeps read access even across clinics.
  if (found.assignedToId !== null) {
    await setParticipantAccess({
      caseId: found.id,
      userId: found.assignedToId,
      access: "read",
    });
  }
  await ensureParticipant({
    caseId: found.id,
    userId: target.id,
    clinicId: toClinicId,
    access: "owner",
    grantedBy: staff.email,
  });
  await ensureParticipant({
    caseId: found.id,
    userId: staff.id,
    clinicId: found.clinicId,
    access: "read",
    grantedBy: staff.email,
  });

  const updated = await updateCase(found.id, {
    assignedToId: target.id,
    ...(sameClinic ? {} : { referralClinicId: toClinicId }),
  });
  if (updated === null) throw new NotFoundError("Case not found");

  await closeTasks(found.id, ["assignment"], staff.email);
  await ensureTask({
    caseId: found.id,
    clinicId: toClinicId,
    assignedToId: target.id,
    kind: "assignment",
    title: "Case handed over — review and continue",
    detail: input.note,
    createdBy: staff.email,
  });
  await logAudit(found.id, `staff:${staff.email}`, "case_handed_over", {
    toUserId: target.id,
    toClinicId,
    note: input.note,
  });

  const clinicName = await clinicOf(toClinicId);
  await sendStaffAlertEmail({
    to: target.email,
    name: target.name,
    subject: "A case was handed over to you",
    paragraphs: [
      `${staff.email} gave you a case${clinicName === null ? "" : ` at ${clinicName}`}.`,
      input.note,
    ],
    actionLabel: "Open the case",
    path: `/cases/${found.id}`,
    preference: target.notificationChannel,
  }).catch((error: unknown) => {
    console.warn("Handover email failed", error);
  });

  return {
    careCase: updated,
    clinicians: await listParticipants(found.id),
  };
};
