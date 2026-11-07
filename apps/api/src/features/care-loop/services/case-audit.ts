import {
  type AuditEntry,
  isCaseId,
} from "@api/features/care-loop/services/case-dto";
import { auditTrail } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { eq } from "drizzle-orm";

export const listAudit = async (caseId: string): Promise<AuditEntry[]> => {
  if (!isCaseId(caseId)) return [];
  const rows = await db
    .select()
    .from(auditTrail)
    .where(eq(auditTrail.caseId, caseId))
    .orderBy(auditTrail.createdAt);
  return rows.map((row) => ({
    id: row.id,
    caseId: row.caseId,
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const logAudit = async (
  caseId: string,
  actor: string,
  action: string,
  detail: unknown = {},
): Promise<void> => {
  await db.insert(auditTrail).values({ caseId, actor, action, detail });
};
