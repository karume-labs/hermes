import { normalizePhone } from "@api/features/patient-auth/services/tokens";
import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import type { ClinicPatient } from "@hermes/types";
import { eq, isNull } from "drizzle-orm";

/**
 * A patient who signed up from the app has no clinic. The first clinic that
 * sends them data claims the row by phone number, so the account they already
 * created starts showing that clinic's results without a second sign-up.
 */
export const linkPatientByPhone = async (
  staff: StaffContext,
  phoneInput: string,
): Promise<ClinicPatient> => {
  if (staff.clinicId === null) {
    throw new ForbiddenError("Choose a clinic account to link patients.");
  }
  const phone = normalizePhone(phoneInput);
  const [row] = await db
    .select()
    .from(patients)
    .where(eq(patients.phone, phone))
    .limit(1);
  if (row === undefined) {
    throw new NotFoundError(
      "No account uses that number yet. Ask the patient to sign up first, or add them from the clinic list.",
    );
  }
  if (row.clinicId !== null && row.clinicId !== staff.clinicId) {
    throw new ConflictError(
      "That number already belongs to another clinic's patient.",
    );
  }

  // Only a self-registered row may be claimed; an existing clinic patient is
  // returned untouched so a repeated link is harmless.
  if (isNull(patients.clinicId)) {
    await db
      .update(patients)
      .set({ clinicId: staff.clinicId })
      .where(eq(patients.id, row.id));
  }

  return {
    ...row,
    clinicId: staff.clinicId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    selfRegisteredAt: row.selfRegisteredAt?.toISOString() ?? null,
    caseCount: 0,
    activeCaseCount: 0,
    lastCaseId: null,
    lastCaseAt: null,
  };
};
