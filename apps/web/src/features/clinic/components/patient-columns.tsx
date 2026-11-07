"use client";

import type { ClinicPatient } from "@hermes/types";
import { Anchor, Badge, Group, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";

export const patientColumns: ColumnDef<ClinicPatient>[] = [
  {
    id: "patient",
    header: "Patient",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {row.original.name}
        </Text>
        <Text size="xs" c="dimmed">
          {row.original.id}
        </Text>
      </Stack>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    accessorFn: (row) => row.phone,
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm">{row.original.phone}</Text>
        <Text size="xs" c="dimmed">
          {row.original.email === null ? "No email" : row.original.email}
        </Text>
      </Stack>
    ),
  },
  {
    id: "care",
    header: "Care load",
    accessorFn: (row) => row.activeCaseCount,
    cell: ({ row }) => (
      <Group gap={6}>
        <Badge
          variant="light"
          color={row.original.activeCaseCount > 0 ? "orange" : "teal"}
        >
          {row.original.activeCaseCount} active
        </Badge>
        <Text size="xs" c="dimmed">
          {row.original.caseCount} total
        </Text>
      </Group>
    ),
  },
  {
    id: "last",
    header: "Latest result",
    accessorFn: (row) => row.lastCaseAt ?? "",
    cell: ({ row }) => (
      <Text size="sm">
        {row.original.lastCaseAt === null
          ? "No result on file"
          : dayjs(row.original.lastCaseAt).format("D MMM YYYY")}
      </Text>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.lastCaseId === null ? (
        <Text size="xs" c="dimmed">
          No case
        </Text>
      ) : (
        <Anchor
          component={Link}
          href={`/cases/${row.original.lastCaseId}`}
          size="sm"
          fw={600}
        >
          Open latest
        </Anchor>
      ),
  },
];
