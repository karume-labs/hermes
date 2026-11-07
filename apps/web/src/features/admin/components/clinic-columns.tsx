"use client";
import type { AdminClinicSummary } from "@hermes/types";
import { Badge, Button, Group, Stack, Switch, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useSetClinicActive } from "@/features/admin/services/mutations";

export const ClinicStatus = ({
  clinic,
}: {
  clinic: AdminClinicSummary;
}): ReactNode => {
  const setActive = useSetClinicActive();
  return (
    <Group gap="xs" wrap="nowrap">
      <Badge variant="light" color={clinic.isActive ? "teal" : "gray"}>
        {clinic.isActive ? "Active" : "Inactive"}
      </Badge>
      <Switch
        size="xs"
        checked={clinic.isActive}
        disabled={setActive.isPending}
        aria-label={`${clinic.isActive ? "Pause" : "Activate"} ${clinic.name}`}
        onChange={(event) =>
          setActive.mutate({
            id: clinic.id,
            isActive: event.currentTarget.checked,
          })
        }
      />
    </Group>
  );
};

export const buildClinicColumns = (
  onEdit: (clinic: AdminClinicSummary) => void,
): ColumnDef<AdminClinicSummary>[] => [
  {
    id: "clinic",
    header: "Clinic",
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
    id: "timezone",
    header: "Timezone",
    accessorFn: (row) => row.timezone,
    cell: ({ row }) => <Text size="sm">{row.original.timezone}</Text>,
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => (row.isActive ? "active" : "inactive"),
    cell: ({ row }) => <ClinicStatus clinic={row.original} />,
  },
  {
    id: "patients",
    header: "Patients",
    accessorFn: (row) => row.patientCount,
    cell: ({ row }) => <Text size="sm">{row.original.patientCount}</Text>,
  },
  {
    id: "staff",
    header: "Staff",
    accessorFn: (row) => row.staffCount,
    cell: ({ row }) => <Text size="sm">{row.original.staffCount}</Text>,
  },
  {
    id: "open",
    header: "Open cases",
    accessorFn: (row) => row.openCaseCount,
    cell: ({ row }) => (
      <Badge
        variant="light"
        color={row.original.openCaseCount > 0 ? "orange" : "teal"}
      >
        {row.original.openCaseCount}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Button
        size="compact-xs"
        variant="subtle"
        onClick={() => onEdit(row.original)}
      >
        Edit
      </Button>
    ),
  },
];
