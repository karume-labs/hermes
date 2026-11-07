import { toTask } from "@api/features/care-loop/services/task-dto";
import type { StaffContext } from "@api/features/shared/auth/index";
import { caseTasks } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CaseTask } from "@hermes/types";
import { and, desc, eq, isNull } from "drizzle-orm";

export const listTasks = async (
  staff: StaffContext,
  filters: { caseId?: string; status?: "open" | "done" },
): Promise<CaseTask[]> => {
  const predicates = [];
  if (staff.role !== "admin" && staff.clinicId !== null) {
    predicates.push(eq(caseTasks.clinicId, staff.clinicId));
  }
  if (filters.caseId !== undefined)
    predicates.push(eq(caseTasks.caseId, filters.caseId));
  predicates.push(eq(caseTasks.status, filters.status ?? "open"));
  const rows = await db
    .select()
    .from(caseTasks)
    .where(and(...predicates))
    .orderBy(desc(caseTasks.createdAt));
  return rows.map(toTask);
};

export const openTaskCount = async (
  clinicId: string | null,
): Promise<number> => {
  const rows = await db
    .select({ id: caseTasks.id })
    .from(caseTasks)
    .where(
      clinicId === null
        ? eq(caseTasks.status, "open")
        : and(eq(caseTasks.status, "open"), eq(caseTasks.clinicId, clinicId)),
    );
  return rows.length;
};

export const listOpenTasks = async (
  clinicId: string | null,
): Promise<CaseTask[]> => {
  const rows = await db
    .select()
    .from(caseTasks)
    .where(
      clinicId === null
        ? and(eq(caseTasks.status, "open"), isNull(caseTasks.doneAt))
        : and(
            eq(caseTasks.status, "open"),
            eq(caseTasks.clinicId, clinicId),
            isNull(caseTasks.doneAt),
          ),
    );
  return rows.map(toTask);
};
