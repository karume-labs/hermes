import type { ReferralRow } from "@api/features/care-loop/services/referral-dto";
import type { StaffContext } from "@api/features/shared/auth/index";
import { NotFoundError } from "@api/features/shared/errors/index";
import { caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { eq } from "drizzle-orm";

export const findReferral = async (id: string): Promise<ReferralRow | null> => {
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
  return row;
};

export const assertReceivedBy = (
  referral: ReferralRow,
  staff: StaffContext,
): void => {
  if (staff.role !== "admin" && referral.toClinicId !== staff.clinicId) {
    throw new NotFoundError("Referral not found");
  }
};
