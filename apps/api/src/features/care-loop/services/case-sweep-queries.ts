import { toCareCase } from "@api/features/care-loop/services/case-dto";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CareCase } from "@hermes/types";
import {
  and,
  isNotNull,
  isNull,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

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
