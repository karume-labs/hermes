"use client";

import type { CaseTask, CaseTaskKind } from "@hermes/types";
import { Badge, Button, Group, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { ReactNode } from "react";

const KIND_LABELS: Record<CaseTaskKind, string> = {
  escalation: "Escalation",
  overdue: "Overdue",
  referral: "Referral",
  assignment: "Assignment",
  surveillance_review: "Surveillance review",
  patient_followup: "Patient follow-up",
};

const KIND_COLORS: Record<CaseTaskKind, string> = {
  escalation: "red",
  overdue: "orange",
  referral: "blue",
  assignment: "gray",
  surveillance_review: "teal",
  patient_followup: "orange",
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
      <Badge color={KIND_COLORS[row.original.kind]} variant="light">
        {KIND_LABELS[row.original.kind]}
      </Badge>
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
          <Text size="xs">{new Date(row.original.dueAt).toLocaleString()}</Text>
          {isOverdue(row.original) ? (
            <Badge color="red" variant="filled" size="xs">
              Overdue
            </Badge>
          ) : null}
        </Group>
      ),
  },
  {
    id: "createdBy",
    header: "Raised by",
    accessorFn: (row) => row.createdBy,
    cell: ({ row }): ReactNode => (
      <Text size="xs" c="dimmed">
        {row.original.createdBy}
      </Text>
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
        <Button
          size="xs"
          variant="light"
          loading={completingId === row.original.id}
          onClick={() => onComplete(row.original.id)}
        >
          Complete
        </Button>
      ),
  },
];
