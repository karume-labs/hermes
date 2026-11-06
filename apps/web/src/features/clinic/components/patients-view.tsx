"use client";

import type { ClinicPatient } from "@hermes/types";
import {
  Alert,
  Anchor,
  Badge,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useClinicPatients } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const columns: ColumnDef<ClinicPatient>[] = [
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

export const PatientsView = (): ReactNode => {
  const [search, setSearch] = useState("");
  const patients = useClinicPatients();
  const rows = patients.data === undefined ? [] : patients.data;
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === "") return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.phone.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term),
    );
  }, [rows, search]);

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Patient roster"
        subtitle="Everyone registered at your clinic with their open care load and the latest result on file."
      />

      {patients.isError ? (
        <Alert color="red" title="Patients unavailable">
          The API rejected the request. Check that it is running and that your
          account is assigned to a clinic.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <MetricCard
          label="Patients"
          value={rows.length}
          hint="Registered at this clinic"
        />
        <MetricCard
          label="Open cases"
          value={rows.reduce((sum, row) => sum + row.activeCaseCount, 0)}
          hint="Results still moving through the loop"
          tone="orange.7"
        />
        <MetricCard
          label="With a result on file"
          value={rows.filter((row) => row.lastCaseAt !== null).length}
          hint="At least one screening result"
          tone="teal.7"
        />
      </SimpleGrid>

      <Group justify="space-between">
        <TextInput
          placeholder="Search name, phone or patient ID"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          w={{ base: "100%", sm: 360 }}
        />
        <Badge variant="light">{visible.length} patients</Badge>
      </Group>

      <DataTable
        data={visible}
        columns={columns}
        loading={patients.isLoading}
        emptyMessage="No patients match this search"
        minWidth={860}
      />
    </Stack>
  );
};
