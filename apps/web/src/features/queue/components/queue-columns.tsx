"use client";

import type { CareCase } from "@hermes/types";
import { Badge, Button, Group, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { ReactNode } from "react";
import { SeverityBadge } from "@/features/cases/components/case-severity-badge";
import { AckState, SlaBadge } from "@/features/cases/components/case-sla-badge";
import { StatusBadge } from "@/features/cases/components/case-status-badge";

const isBreached = (careCase: CareCase): boolean =>
  new Date(careCase.slaDueAt).getTime() < Date.now() &&
  careCase.acknowledgedAt === null;

interface QueueColumnOptions {
  escalatingId: string | null;
  onEscalate: (caseId: string) => void;
}

export const createQueueColumns = ({
  escalatingId,
  onEscalate,
}: QueueColumnOptions): ColumnDef<CareCase, unknown>[] => [
  {
    id: "case",
    header: "Case",
    accessorFn: (row) => row.id,
    cell: ({ row }): ReactNode => (
      <>
        <Text size="xs" ff="monospace">
          {row.original.id.slice(0, 8)}
        </Text>
        <Text size="xs" c="dimmed">
          {row.original.patientId}
        </Text>
      </>
    ),
  },
  {
    id: "severity",
    header: "Severity",
    accessorFn: (row) => row.severity,
    cell: ({ row }): ReactNode => (
      <SeverityBadge severity={row.original.severity} />
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status,
    cell: ({ row }): ReactNode => (
      <Group gap={4} wrap="nowrap">
        <StatusBadge status={row.original.status} />
        {isBreached(row.original) ? (
          <Badge color="red" variant="filled">
            SLA
          </Badge>
        ) : null}
      </Group>
    ),
  },
  {
    id: "sla",
    header: "SLA due",
    accessorFn: (row) => row.slaDueAt,
    cell: ({ row }): ReactNode => (
      <SlaBadge
        slaDueAt={row.original.slaDueAt}
        status={row.original.status}
        severity={row.original.severity}
      />
    ),
  },
  {
    id: "owner",
    header: "Owner",
    accessorFn: (row) => row.assignedToId ?? "unassigned",
    cell: ({ row }): ReactNode =>
      row.original.assignedToId === null ? (
        <Badge color="orange" variant="light">
          Unassigned
        </Badge>
      ) : (
        <Text size="xs" ff="monospace">
          {row.original.assignedToId.slice(0, 8)}
        </Text>
      ),
  },
  {
    id: "ack",
    header: "Mobile ack",
    enableSorting: false,
    cell: ({ row }): ReactNode => (
      <AckState acknowledgedAt={row.original.acknowledgedAt} />
    ),
  },
  {
    id: "summary",
    header: "Summary",
    accessorFn: (row) => row.summaryPlainLanguage,
    enableSorting: false,
    cell: ({ row }): ReactNode => (
      <Text size="sm" lineClamp={2} maw={280}>
        {row.original.summaryPlainLanguage}
      </Text>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }): ReactNode => (
      <Group gap={4} wrap="nowrap" justify="flex-end">
        <Button
          component={Link}
          href={`/cases/${row.original.id}`}
          size="xs"
          variant="light"
        >
          Open
        </Button>
        <Button
          size="xs"
          variant="subtle"
          color="red"
          loading={escalatingId === row.original.id}
          disabled={row.original.status === "closed"}
          onClick={() => onEscalate(row.original.id)}
        >
          Escalate
        </Button>
      </Group>
    ),
  },
];
