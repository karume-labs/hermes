import type { caseReferrals } from "@db/care-loop/schema/index";
import type { CaseReferral } from "@hermes/types";

export type ReferralRow = typeof caseReferrals.$inferSelect;

export const toReferral = (row: ReferralRow): CaseReferral => ({
  ...row,
  acceptedAt: row.acceptedAt?.toISOString() ?? null,
  declinedAt: row.declinedAt?.toISOString() ?? null,
  completedAt: row.completedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const activeStatuses = ["sent", "accepted"] as const;
