import { defaultAssigneeId } from "@api/features/care-loop/services/assignment-service";
import {
  createCase,
  findCase,
} from "@api/features/care-loop/services/case-repository";
import type { StaffContext } from "@api/features/shared/auth/index";
import { user } from "@db/auth/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { inArray } from "drizzle-orm";
import type { CareLoopFixtures } from "./care-loop-fixture-types";

export type { CareLoopFixtures } from "./care-loop-fixture-types";

let sequence = 0;

// Real database fixtures under their own clinics, so cleanup can remove every
// row this suite created without touching seeded demo data.
export const createFixtures = async (
  label: string,
): Promise<CareLoopFixtures> => {
  sequence += 1;
  const suffix = `${label}-${Date.now()}-${sequence}`;
  const clinicA = `itest-a-${suffix}`;
  const clinicB = `itest-b-${suffix}`;
  const patientId = `itest-patient-${suffix}`;
  const coordinatorId = `itest-coord-${suffix}`;
  const clinicianId = `itest-clin-${suffix}`;
  const coordinatorBId = `itest-coord-b-${suffix}`;

  await db.insert(clinics).values([
    { id: clinicA, name: `Test clinic A ${suffix}` },
    { id: clinicB, name: `Test clinic B ${suffix}` },
  ]);
  await db.insert(user).values([
    {
      id: coordinatorId,
      name: "Test Coordinator",
      email: `coord-${suffix}@hermescare.test`,
      emailVerified: true,
      role: "coordinator",
      clinicId: clinicA,
    },
    {
      id: clinicianId,
      name: "Test Clinician",
      email: `clin-${suffix}@hermescare.test`,
      emailVerified: true,
      role: "clinician",
      clinicId: clinicA,
    },
    {
      id: coordinatorBId,
      name: "Receiving Coordinator",
      email: `coord-b-${suffix}@hermescare.test`,
      emailVerified: true,
      role: "coordinator",
      clinicId: clinicB,
    },
  ]);
  await db.insert(patients).values({
    id: patientId,
    clinicId: clinicA,
    name: "Test Patient",
    phone: `+2547${String(Date.now()).slice(-8)}${sequence}`,
  });

  const coordinator: StaffContext = {
    id: coordinatorId,
    email: `coord-${suffix}@hermescare.test`,
    role: "coordinator",
    clinicId: clinicA,
    organizationId: null,
    via: "session",
  };
  const clinician: StaffContext = {
    id: clinicianId,
    email: `clin-${suffix}@hermescare.test`,
    role: "clinician",
    clinicId: clinicA,
    organizationId: null,
    via: "session",
  };
  const admin: StaffContext = {
    id: "service",
    email: "service",
    role: "admin",
    clinicId: null,
    organizationId: null,
    via: "service",
  };

  let caseCount = 0;
  const makeCase: CareLoopFixtures["createCase"] = async (patch = {}) => {
    caseCount += 1;
    return createCase({
      patientId: patch.patientId ?? patientId,
      clinicId: patch.clinicId ?? clinicA,
      labPayloadId: `itest-lab-${suffix}-${caseCount}`,
      severity: "Actionable",
      status: patch.status ?? "acknowledged",
      slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      summaryPlainLanguage: "Test screening result needs a review.",
      assignedToId:
        patch.assignedToId === undefined ? coordinatorId : patch.assignedToId,
      nextReviewAt: patch.nextReviewAt ?? null,
    });
  };

  return {
    clinicA,
    clinicB,
    patientId,
    coordinatorId,
    clinicianId,
    coordinatorBId,
    coordinator,
    clinician,
    admin,
    createCase: makeCase,
    cleanup: async () => {
      await db
        .delete(careCases)
        .where(inArray(careCases.clinicId, [clinicA, clinicB]));
      await db.delete(patients).where(inArray(patients.id, [patientId]));
      await db
        .delete(user)
        .where(inArray(user.id, [coordinatorId, clinicianId, coordinatorBId]));
      await db.delete(clinics).where(inArray(clinics.id, [clinicA, clinicB]));
    },
  };
};

export const findOwnedCase = async (caseId: string) => {
  const found = await findCase(caseId);
  if (found === null) throw new Error("Fixture case disappeared");
  return found;
};

export { defaultAssigneeId };
