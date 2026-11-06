import type { StaffContext } from "@api/features/shared/auth/index";
import { caseTasks } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CaseTask, CaseTaskKind } from "@hermes/types";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

type TaskRow = typeof caseTasks.$inferSelect;

const toTask = (row: TaskRow): CaseTask => ({
  ...row,
  dueAt: row.dueAt?.toISOString() ?? null,
  doneAt: row.doneAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

export const createTask = async (input: {
  caseId: string;
  clinicId: string;
  assignedToId?: string | null;
  kind: CaseTaskKind;
  title: string;
  detail?: string | null;
  dueAt?: Date | null;
  createdBy: string;
}): Promise<CaseTask> => {
  const [row] = await db.insert(caseTasks).values(input).returning();
  return toTask(row);
};

// One open task of a kind is enough; retries and repeat escalations must not
// flood a clinic's queue.
export const ensureTask = async (input: {
  caseId: string;
  clinicId: string;
  assignedToId?: string | null;
  kind: CaseTaskKind;
  title: string;
  detail?: string | null;
  dueAt?: Date | null;
  createdBy: string;
}): Promise<CaseTask> => {
  const [existing] = await db
    .select()
    .from(caseTasks)
    .where(
      and(
        eq(caseTasks.caseId, input.caseId),
        eq(caseTasks.kind, input.kind),
        eq(caseTasks.status, "open"),
      ),
    )
    .limit(1);
  if (existing !== undefined) return toTask(existing);
  return createTask(input);
};

// A scheduled task belongs to one due date: the same case may need another
// review after the next date without the old task blocking it.
export const ensureScheduledTask = async (input: {
  caseId: string;
  clinicId: string;
  assignedToId?: string | null;
  kind: CaseTaskKind;
  title: string;
  detail?: string | null;
  dueAt: Date;
  createdBy: string;
}): Promise<CaseTask> => {
  const [existing] = await db
    .select()
    .from(caseTasks)
    .where(
      and(
        eq(caseTasks.caseId, input.caseId),
        eq(caseTasks.kind, input.kind),
        eq(caseTasks.dueAt, input.dueAt),
      ),
    )
    .limit(1);
  if (existing !== undefined) return toTask(existing);
  return createTask(input);
};

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

export const completeTask = async (
  staff: StaffContext,
  taskId: string,
): Promise<CaseTask | null> => {
  const [row] = await db
    .update(caseTasks)
    .set({ status: "done", doneAt: new Date(), doneBy: staff.email })
    .where(
      and(
        eq(caseTasks.id, taskId),
        eq(caseTasks.status, "open"),
        staff.role === "admin" || staff.clinicId === null
          ? undefined
          : eq(caseTasks.clinicId, staff.clinicId),
      ),
    )
    .returning();
  return row === undefined ? null : toTask(row);
};

export const closeTasks = async (
  caseId: string,
  kinds: CaseTaskKind[],
  doneBy: string,
): Promise<void> => {
  await db
    .update(caseTasks)
    .set({ status: "done", doneAt: new Date(), doneBy })
    .where(
      and(
        eq(caseTasks.caseId, caseId),
        eq(caseTasks.status, "open"),
        inArray(caseTasks.kind, kinds),
      ),
    );
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
