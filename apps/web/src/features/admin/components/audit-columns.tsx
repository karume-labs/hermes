"use client";

import type { AdminAuditEntry } from "@hermes/types";
import { Anchor, Badge, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";

export const auditColumns: ColumnDef<AdminAuditEntry>[] = [
  {
    id: "when",
    header: "When",
    accessorFn: (row) => row.createdAt,
    cell: ({ row }) => (
      <Text size="sm">
        {dayjs(row.original.createdAt).format("D MMM · HH:mm")}
      </Text>
    ),
  },
  {
    id: "action",
    header: "Action",
    accessorFn: (row) => row.action,
    cell: ({ row }) => (
      <Badge variant="light" color="brandSlate">
        {row.original.action.replaceAll("_", " ")}
      </Badge>
    ),
  },
  {
    id: "actor",
    header: "Actor",
    accessorFn: (row) => row.actor,
    cell: ({ row }) => <Text size="sm">{row.original.actor}</Text>,
  },
  {
    id: "patient",
    header: "Patient",
    accessorFn: (row) => row.patientName,
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {row.original.patientName}
        </Text>
        <Text size="xs" c="dimmed">
          {row.original.clinicName}
        </Text>
      </Stack>
    ),
  },
  {
    id: "case",
    header: "Result",
    accessorFn: (row) => row.caseSummary,
    cell: ({ row }) => (
      <Text size="sm" lineClamp={2} maw={360}>
        {row.original.caseSummary}
      </Text>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Anchor
        component={Link}
        href={`/cases/${row.original.caseId}`}
        size="sm"
        fw={600}
      >
        Open case
      </Anchor>
    ),
  },
];
