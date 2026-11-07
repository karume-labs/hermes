import type { caseTasks } from "@db/care-loop/schema/index";
import type { CaseTask } from "@hermes/types";

export type TaskRow = typeof caseTasks.$inferSelect;

export const toTask = (row: TaskRow): CaseTask => ({
  ...row,
  dueAt: row.dueAt?.toISOString() ?? null,
  doneAt: row.doneAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});
