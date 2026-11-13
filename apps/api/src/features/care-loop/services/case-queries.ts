import {
  type CaseFilters,
  isCaseId,
  isSeverity,
  isStatus,
  toCareCase,
} from "@api/features/care-loop/services/case-dto";
import {
  caseScope,
  normalizeScope,
  type ScopeInput,
} from "@api/features/care-loop/services/case-scope";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import type { CareCase, CaseListItem } from "@hermes/types";
import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

// `scope.clinicId === null` with no organization and no user means the caller
// is a platform admin or a system job and may read every clinic.
export const listCases = async (
  filters: CaseFilters,
  scope: ScopeInput = null,
): Promise<CaseListItem[]> => {
  const predicates = [];
  const visible = caseScope(normalizeScope(scope));
  if (visible !== undefined) predicates.push(visible);
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
  scope: ScopeInput = null,
): Promise<CareCase | null> => {
  if (!isCaseId(id)) return null;
  const visible = caseScope(normalizeScope(scope));
  const [row] = await db
    .select()
    .from(careCases)
    .where(
      visible === undefined
        ? eq(careCases.id, id)
        : and(eq(careCases.id, id), visible),
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
  scope: ScopeInput = null,
): Promise<CareCase[]> => {
  const visible = caseScope(normalizeScope(scope));
  const rows = await db
    .select()
    .from(careCases)
    .where(visible === undefined ? undefined : visible);
  return rows.map(toCareCase);
};

/**
 * Open cases whose deadline has passed, or that stayed unacknowledged past
 * the window for their severity. The cron uses this instead of scanning every
 * case ever recorded.
 */
export const listCasesNeedingEscalation = async (
  now: Date,
): Promise<CareCase[]> => {
  const rows = await db
    .select()
    .from(careCases)
    .where(
      and(
        notInArray(careCases.status, ["closed", "escalated"]),
        or(
          lte(careCases.slaDueAt, now),
          and(
            isNull(careCases.acknowledgedAt),
            sql`${careCases.createdAt} <= ${now.toISOString()}::timestamptz - case when ${careCases.severity} = 'Routine' then interval '168 hours' else interval '48 hours' end`,
          ),
        ),
      ),
    );
  return rows.map(toCareCase);
};

/** Surveillance reviews whose date has arrived and that are still open. */
export const listSurveillanceDue = async (now: Date): Promise<CareCase[]> => {
  const rows = await db
    .select()
    .from(careCases)
    .where(
      and(
        ne(careCases.status, "closed"),
        isNotNull(careCases.nextReviewAt),
        lte(careCases.nextReviewAt, now),
      ),
    );
  return rows.map(toCareCase);
};
