import { teamMember } from "@api/features/care-loop/services/assignment-service";
import { logAudit } from "@api/features/care-loop/services/case-audit";
import { findCase } from "@api/features/care-loop/services/case-repository";
import {
  ensureParticipant,
  listParticipants,
  revokeParticipant,
} from "@api/features/care-loop/services/participants-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import type { CaseParticipant } from "@hermes/types";

export const addCaseClinician = async (
  staff: StaffContext,
  caseId: string,
  input: { userId: string; access: "collaborator" | "read" },
): Promise<CaseParticipant[]> => {
  const found = await findCase(caseId, {
    clinicId: staff.clinicId,
    organizationId: staff.organizationId,
    userId: staff.id,
  });
  if (found === null) throw new NotFoundError("Case not found");
  const target = await teamMember(input.userId);
  if (target === null) throw new NotFoundError("Staff member not found");
  if (target.role === "admin" || target.role === "org_admin") {
    throw new ConflictError("Choose a clinician or coordinator.");
  }
  await ensureParticipant({
    caseId: found.id,
    userId: target.id,
    clinicId: target.clinicId ?? found.clinicId,
    access: input.access,
    grantedBy: staff.email,
  });
  await logAudit(found.id, `staff:${staff.email}`, "clinician_added", {
    userId: target.id,
    access: input.access,
  });
  return listParticipants(found.id);
};

export const removeCaseClinician = async (
  staff: StaffContext,
  caseId: string,
  userId: string,
): Promise<CaseParticipant[]> => {
  const found = await findCase(caseId, {
    clinicId: staff.clinicId,
    organizationId: staff.organizationId,
    userId: staff.id,
  });
  if (found === null) throw new NotFoundError("Case not found");
  if (found.assignedToId === userId) {
    throw new ConflictError(
      "Hand the case to another clinician before removing the owner.",
    );
  }
  const removed = await revokeParticipant(found.id, userId);
  if (!removed) throw new NotFoundError("That person is not on this case");
  await logAudit(found.id, `staff:${staff.email}`, "clinician_removed", {
    userId,
  });
  return listParticipants(found.id);
};
