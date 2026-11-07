"use client";

import type { ClinicPatient } from "@hermes/types";
import { Group, Stack, Text } from "@mantine/core";
import { IconExternalLink, IconFolderOpen } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { TableRowActions } from "@/features/shared/components/table/table-row-actions";
import { Pill } from "@/features/shared/components/ui/pill";

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
        <Text size="xs" c="dimmed" ff="monospace">
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
          {row.original.email === null
            ? "No email on file"
            : row.original.email}
        </Text>
      </Stack>
    ),
  },
  {
    id: "care",
    header: "Care load",
    accessorFn: (row) => row.activeCaseCount,
    cell: ({ row }) => (
      <Group gap={8}>
        <Pill
          tone={row.original.activeCaseCount > 0 ? "actionable" : "routine"}
          description="Results on this patient that have not been closed yet."
        >
          {`${row.original.activeCaseCount} open`}
        </Pill>
        <Text size="xs" c="dimmed">
          {`${row.original.caseCount} all time`}
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
    cell: ({ row }) => {
      const lastCaseId = row.original.lastCaseId;
      if (lastCaseId === null)
        return (
          <Text size="xs" c="dimmed">
            No case yet
          </Text>
        );
      return (
        <TableRowActions
          inline={[
            {
              label: "Open latest result",
              icon: <IconFolderOpen size={15} />,
              onClick: () => {
                window.location.assign(`/cases/${lastCaseId}`);
              },
            },
          ]}
          menu={[
            {
              label: "Open latest result",
              icon: <IconFolderOpen size={15} />,
              onClick: () => {
                window.location.assign(`/cases/${lastCaseId}`);
              },
            },
            {
              label: "Open patient in a new tab",
              icon: <IconExternalLink size={15} />,
              onClick: () => {
                window.open(`/cases/${lastCaseId}`, "_blank", "noopener");
              },
            },
          ]}
        />
      );
    },
  },
];
