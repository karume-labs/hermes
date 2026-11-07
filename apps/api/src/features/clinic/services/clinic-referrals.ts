import { listReferrals } from "@api/features/care-loop/services/referral-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import type { ClinicReferral } from "@hermes/types";
import { inArray } from "drizzle-orm";

export const listClinicReferrals = async (
  staff: StaffContext,
): Promise<ClinicReferral[]> => {
  const referrals = await listReferrals(staff);
  if (referrals.length === 0) return [];

  const caseRows = await db
    .select({
      id: careCases.id,
      patientId: careCases.patientId,
      summary: careCases.summaryPlainLanguage,
    })
    .from(careCases)
    .where(
      inArray(
        careCases.id,
        referrals.map((referral) => referral.caseId),
      ),
    );
  const patientRows = await db
    .select({ id: patients.id, name: patients.name })
    .from(patients)
    .where(
      inArray(
        patients.id,
        caseRows.map((row) => row.patientId),
      ),
    );
  const clinicRows = await db
    .select({ id: clinics.id, name: clinics.name })
    .from(clinics);

  return referrals.flatMap((referral) => {
    const careCase = caseRows.find((row) => row.id === referral.caseId);
    if (careCase === undefined) return [];
    const from = clinicRows.find((row) => row.id === referral.fromClinicId);
    const to = clinicRows.find((row) => row.id === referral.toClinicId);
    const patient = patientRows.find((row) => row.id === careCase.patientId);
    return [
      {
        ...referral,
        patientName: patient?.name ?? careCase.patientId,
        caseSummary: careCase.summary,
        fromClinicName: from?.name ?? referral.fromClinicId,
        toClinicName: to?.name ?? referral.toClinicId,
      },
    ];
  });
};
