"use client";

import type { ClinicReferral } from "@hermes/types";
import { Anchor, Badge, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";

const STATUS_COLOR = {
  sent: "orange",
  accepted: "teal",
  declined: "red",
  completed: "green",
} as const;

export const referralColumns: ColumnDef<ClinicReferral>[] = [
  {
    id: "patient",
    header: "Patient",
    accessorFn: (row) => row.patientName,
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {row.original.patientName}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1} maw={260}>
          {row.original.caseSummary}
        </Text>
      </Stack>
    ),
  },
  {
    id: "route",
    header: "Route",
    accessorFn: (row) => `${row.fromClinicName} ${row.toClinicName}`,
    cell: ({ row }) => (
      <Text size="sm">
        {row.original.fromClinicName} → {row.original.toClinicName}
      </Text>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status,
    cell: ({ row }) => (
      <Badge
        variant="light"
        color={STATUS_COLOR[row.original.status]}
        tt="capitalize"
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "note",
    header: "Hand-off note",
    accessorFn: (row) => row.note,
    cell: ({ row }) => (
      <Text size="sm" lineClamp={2} maw={340}>
        {row.original.note}
      </Text>
    ),
  },
  {
    id: "sent",
    header: "Sent",
    accessorFn: (row) => row.createdAt,
    cell: ({ row }) => (
      <Text size="sm">
        {dayjs(row.original.createdAt).format("D MMM YYYY")}
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
