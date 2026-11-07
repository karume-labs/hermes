import {
  type CaseFilters,
  isCaseId,
  isSeverity,
  isStatus,
  type NewCase,
  toCareCase,
} from "@api/features/care-loop/services/case-dto";
import { careCases, caseReferrals } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import type { CareCase, CaseListItem } from "@hermes/types";
import { and, desc, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";

const inClinicScope = (clinicId: string) =>
  or(
    eq(careCases.clinicId, clinicId),
    inArray(
      careCases.id,
      db
        .select({ id: caseReferrals.caseId })
        .from(caseReferrals)
        .where(
          and(
            eq(caseReferrals.toClinicId, clinicId),
            inArray(caseReferrals.status, ["sent", "accepted"]),
          ),
        ),
    ),
  );

// `clinicId` is the staff member's tenant: null means the caller is an admin
// or a system job and may read every clinic.
export const listCases = async (
  filters: CaseFilters,
  clinicId: string | null = null,
): Promise<CaseListItem[]> => {
  const predicates = [];
  if (clinicId !== null) predicates.push(inClinicScope(clinicId));
  if (filters.severity !== undefined && isSeverity(filters.severity))
    predicates.push(eq(careCases.severity, filters.severity));
  if (filters.status !== undefined && isStatus(filters.status))
    predicates.push(eq(careCases.status, filters.status));
  if (filters.assignedToId !== undefined)
    predicates.push(eq(careCases.assignedToId, filters.assignedToId));
  if (filters.unassigned === true)
    predicates.push(isNull(careCases.assignedToId));
  if (filters.overdue === true) {
    predicates.push(
      and(
        lt(careCases.slaDueAt, new Date()),
        ne(careCases.status, "closed"),
        isNull(careCases.acknowledgedAt),
      ),
    );
  }
  const rows = await db
    .select({
      careCase: careCases,
      patientName: patients.name,
      patientPhone: patients.phone,
    })
    .from(careCases)
    .innerJoin(patients, eq(patients.id, careCases.patientId))
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(desc(careCases.createdAt));
  return rows.map((row) => ({
    ...toCareCase(row.careCase),
    patientName: row.patientName,
    patientPhone: row.patientPhone,
  }));
};

export const findCase = async (
  id: string,
  clinicId: string | null = null,
): Promise<CareCase | null> => {
  if (!isCaseId(id)) return null;
  const [row] = await db
    .select()
    .from(careCases)
    .where(
      clinicId === null
        ? eq(careCases.id, id)
        : and(eq(careCases.id, id), inClinicScope(clinicId)),
    );
  if (row === undefined) return null;
  return toCareCase(row);
};

// Lab feeds retry. The source message id is the idempotency key, so a
// redelivered FHIR/HL7 payload resolves to the original case.
export const findCaseByLabPayloadId = async (
  labPayloadId: string,
): Promise<CareCase | null> => {
  const [row] = await db
    .select()
    .from(careCases)
    .where(eq(careCases.labPayloadId, labPayloadId))
    .limit(1);
  if (row === undefined) return null;
  return toCareCase(row);
};

export const listAllCases = async (
  clinicId: string | null = null,
): Promise<CareCase[]> => {
  const rows = await db
    .select()
    .from(careCases)
    .where(clinicId === null ? undefined : inClinicScope(clinicId));
  return rows.map(toCareCase);
};

export const createCase = async (input: NewCase): Promise<CareCase> => {
  const [row] = await db.insert(careCases).values(input).returning();
  return toCareCase(row);
};

export const updateCase = async (
  id: string,
  patch: Partial<NewCase>,
): Promise<CareCase | null> => {
  if (!isCaseId(id)) return null;
  const [row] = await db
    .update(careCases)
    .set(patch)
    .where(eq(careCases.id, id))
    .returning();
  if (row === undefined) return null;
  return toCareCase(row);
};
