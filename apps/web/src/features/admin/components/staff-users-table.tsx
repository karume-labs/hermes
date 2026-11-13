"use client";

import type { StaffRole } from "@hermes/types";
import { Badge, Select, Switch, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useUpdateStaffUser } from "@/features/admin/services/mutations";
import { useClinics, useStaffUsers } from "@/features/admin/services/queries";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataTableSkeleton } from "@/features/shared/components/table/data-table-skeleton";

const ROLE_OPTIONS = [
  { value: "coordinator", label: "Coordinator" },
  { value: "clinician", label: "Clinician" },
  { value: "org_admin", label: "Organization admin" },
  { value: "admin", label: "Platform administrator" },
];

export interface StaffUserRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  clinicId: string | null;
  clinicName: string | null;
  banned: boolean;
  createdAt: string;
}

export const StaffUsersTable = (): ReactNode => {
  const users = useStaffUsers();
  const clinics = useClinics();
  const update = useUpdateStaffUser();

  const clinicOptions = (clinics.data ?? []).map((clinic) => ({
    value: clinic.id,
    label: clinic.name,
  }));

  const columns = useMemo<ColumnDef<StaffUserRow, unknown>[]>(
    () => [
      {
        id: "person",
        header: "Staff member",
        accessorFn: (row) => row.name,
        cell: ({ row }): ReactNode => (
          <>
            <Text size="sm" fw={600}>
              {row.original.name}
            </Text>
            <Text size="xs" c="dimmed">
              {row.original.email}
            </Text>
          </>
        ),
      },
      {
        id: "role",
        header: "Role",
        accessorFn: (row) => row.role,
        cell: ({ row }): ReactNode => (
          <Select
            size="xs"
            data={ROLE_OPTIONS}
            value={row.original.role}
            allowDeselect={false}
            onChange={(value) => {
              if (
                value === "admin" ||
                value === "org_admin" ||
                value === "clinician" ||
                value === "coordinator"
              ) {
                update.mutate({
                  id: row.original.id,
                  patch: { role: value },
                });
              }
            }}
          />
        ),
      },
      {
        id: "clinic",
        header: "Clinic",
        accessorFn: (row) => row.clinicName,
        cell: ({ row }): ReactNode =>
          row.original.role === "admin" && row.original.clinicId === null ? (
            <Badge variant="light">All clinics</Badge>
          ) : (
            <Select
              size="xs"
              data={clinicOptions}
              value={row.original.clinicId}
              placeholder="Not assigned"
              onChange={(value) =>
                update.mutate({
                  id: row.original.id,
                  patch: { clinicId: value },
                })
              }
            />
          ),
      },
      {
        id: "access",
        header: "Access",
        accessorFn: (row) => (row.banned ? 1 : 0),
        cell: ({ row }): ReactNode => (
          <Switch
            size="sm"
            checked={!row.original.banned}
            aria-label="Can sign in"
            onChange={(event) =>
              update.mutate({
                id: row.original.id,
                patch: {
                  banned: !event.currentTarget.checked,
                  banReason: event.currentTarget.checked
                    ? null
                    : "Access disabled by an administrator",
                },
              })
            }
          />
        ),
      },
    ],
    [clinicOptions, update],
  );

  if (users.isLoading)
    return <DataTableSkeleton columnCount={4} rowCount={4} />;
  return (
    <DataTable
      data={users.data ?? []}
      columns={columns}
      minWidth={680}
      emptyMessage="No staff accounts yet."
    />
  );
};
