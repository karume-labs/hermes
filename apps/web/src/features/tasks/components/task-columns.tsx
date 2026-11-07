"use client";

import type { CaseTask, CaseTaskKind } from "@hermes/types";
import { Group, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { ReactNode } from "react";
import { TableRowActions } from "@/features/shared/components/table/table-row-actions";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

const KIND_LABELS: Record<CaseTaskKind, string> = {
  escalation: "Escalation",
  overdue: "Overdue follow-up",
  referral: "Referral",
  assignment: "Ownership",
  surveillance_review: "Surveillance review",
  patient_followup: "Patient asked for help",
};

const KIND_TONES: Record<CaseTaskKind, Tone> = {
  escalation: "urgent",
  overdue: "actionable",
  referral: "info",
  assignment: "routine",
  surveillance_review: "routine",
  patient_followup: "actionable",
};

const isOverdue = (task: CaseTask): boolean =>
  task.status === "open" &&
  task.dueAt !== null &&
  new Date(task.dueAt).getTime() < Date.now();

interface TaskColumnOptions {
  completingId: string | null;
  onComplete: (taskId: string) => void;
}

export const createTaskColumns = ({
  completingId,
  onComplete,
}: TaskColumnOptions): ColumnDef<CaseTask, unknown>[] => [
  {
    id: "kind",
    header: "Kind",
    accessorFn: (row) => row.kind,
    cell: ({ row }): ReactNode => (
      <Pill tone={KIND_TONES[row.original.kind]}>
        {KIND_LABELS[row.original.kind]}
      </Pill>
    ),
  },
  {
    id: "task",
    header: "Task",
    accessorFn: (row) => row.title,
    enableSorting: false,
    cell: ({ row }): ReactNode => (
      <>
        <Text size="sm" fw={600}>
          {row.original.title}
        </Text>
        {row.original.detail === null ? null : (
          <Text size="xs" c="dimmed" lineClamp={2} maw={320}>
            {row.original.detail}
          </Text>
        )}
      </>
    ),
  },
  {
    id: "case",
    header: "Case",
    accessorFn: (row) => row.caseId,
    cell: ({ row }): ReactNode => (
      <Link href={`/cases/${row.original.caseId}`}>
        <Text size="xs" ff="monospace" td="underline">
          {row.original.caseId.slice(0, 8)}
        </Text>
      </Link>
    ),
  },
  {
    id: "due",
    header: "Due",
    accessorFn: (row) => row.dueAt ?? "",
    cell: ({ row }): ReactNode =>
      row.original.dueAt === null ? (
        <Text size="xs" c="dimmed">
          No date
        </Text>
      ) : (
        <Group gap={6} wrap="nowrap">
          <Text size="xs">
            {new Date(row.original.dueAt).toLocaleDateString()}
          </Text>
          {isOverdue(row.original) ? (
            <Pill tone="urgent" description="The due date has passed.">
              Late
            </Pill>
          ) : null}
        </Group>
      ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }): ReactNode =>
      row.original.status === "done" ? (
        <Text size="xs" c="dimmed">
          Done
        </Text>
      ) : (
        <TableRowActions
          inline={[
            {
              label: "Mark as done",
              icon: <IconCheck size={15} />,
              onClick: () => onComplete(row.original.id),
              loading: completingId === row.original.id,
            },
          ]}
          menu={[
            {
              label: "Mark as done",
              icon: <IconCheck size={15} />,
              onClick: () => onComplete(row.original.id),
            },
            {
              label: "Open the case file",
              icon: <IconCheck size={15} />,
              onClick: () => {
                window.location.assign(`/cases/${row.original.caseId}`);
              },
            },
          ]}
        />
      ),
  },
];
