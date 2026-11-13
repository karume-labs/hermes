import {
  careCases,
  caseClinicians,
  caseReferrals,
} from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import { and, eq, inArray, isNull, or } from "drizzle-orm";

/** Staff tenant scope: a clinic, an organization, or explicit participation. */
export interface CaseScope {
  clinicId: string | null;
  organizationId: string | null;
  userId: string | null;
}

export type ScopeInput = string | null | CaseScope | Partial<CaseScope>;

export const normalizeScope = (scope: ScopeInput): CaseScope => {
  if (typeof scope === "string" || scope === null) {
    return { clinicId: scope, organizationId: null, userId: null };
  }
  return {
    clinicId: scope.clinicId ?? null,
    organizationId: scope.organizationId ?? null,
    userId: scope.userId ?? null,
  };
};

const casesReferredTo = (clinicId: string) =>
  db
    .select({ id: caseReferrals.caseId })
    .from(caseReferrals)
    .where(
      and(
        eq(caseReferrals.toClinicId, clinicId),
        inArray(caseReferrals.status, ["sent", "accepted"]),
      ),
    );

export const caseScope = (scope: CaseScope) => {
  const clauses = [];
  if (scope.clinicId !== null) {
    clauses.push(
      or(
        eq(careCases.clinicId, scope.clinicId),
        inArray(careCases.id, casesReferredTo(scope.clinicId)),
      ),
    );
  }
  if (scope.organizationId !== null) {
    clauses.push(
      inArray(
        careCases.clinicId,
        db
          .select({ id: clinics.id })
          .from(clinics)
          .where(eq(clinics.organizationId, scope.organizationId)),
      ),
    );
  }
  // A clinician keeps read access after a hand-over even though the case now
  // belongs to someone else.
  if (scope.userId !== null) {
    clauses.push(
      inArray(
        careCases.id,
        db
          .select({ id: caseClinicians.caseId })
          .from(caseClinicians)
          .where(
            and(
              eq(caseClinicians.userId, scope.userId),
              isNull(caseClinicians.revokedAt),
            ),
          ),
      ),
    );
  }
  if (clauses.length === 0) return undefined;
  return or(...clauses);
};
