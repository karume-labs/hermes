import { toTask } from "@api/features/care-loop/services/task-dto";
import type { StaffContext } from "@api/features/shared/auth/index";
import { caseTasks } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CaseTask, CaseTaskKind } from "@hermes/types";
import { and, eq, inArray } from "drizzle-orm";

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
