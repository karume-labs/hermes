import {
  isCaseId,
  type NewCase,
  toCareCase,
} from "@api/features/care-loop/services/case-dto";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CareCase } from "@hermes/types";
import { eq } from "drizzle-orm";

export {
  findCase,
  findCaseByLabPayloadId,
  listAllCases,
  listCases,
  listCasesNeedingEscalation,
  listSurveillanceDue,
} from "@api/features/care-loop/services/case-queries";
export {
  type CaseScope,
  caseScope,
  normalizeScope,
  type ScopeInput,
} from "@api/features/care-loop/services/case-scope";

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
