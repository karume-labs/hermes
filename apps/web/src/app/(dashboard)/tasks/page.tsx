// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TasksView } from "@/features/tasks/components/tasks-view";

export const metadata: Metadata = {
  title: "Tasks",
  description:
    "Staff worklist for surveillance reviews, referrals and patient follow-ups.",
};

const TasksPage = (): ReactNode => <TasksView />;

export default TasksPage;
