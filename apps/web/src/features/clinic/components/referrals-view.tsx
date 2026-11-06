"use client";

import type { ClinicReferral } from "@hermes/types";
import {
  Alert,
  Anchor,
  Badge,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useClinicReferrals } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const STATUS_COLOR = {
  sent: "orange",
  accepted: "teal",
  declined: "red",
  completed: "green",
} as const;

const columns: ColumnDef<ClinicReferral>[] = [
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

export const ReferralsView = (): ReactNode => {
  const [status, setStatus] = useState("all");
  const referrals = useClinicReferrals();
  const rows = referrals.data === undefined ? [] : referrals.data;
  const visible = useMemo(
    () =>
      status === "all" ? rows : rows.filter((row) => row.status === status),
    [rows, status],
  );

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Referral inbox"
        subtitle="Every hand-off into or out of this clinic. Accept, decline or complete decisions on the case file."
        actions={
          <SegmentedControl
            value={status}
            onChange={setStatus}
            data={[
              { value: "all", label: "All" },
              { value: "sent", label: "Sent" },
              { value: "accepted", label: "Accepted" },
              { value: "declined", label: "Declined" },
              { value: "completed", label: "Completed" },
            ]}
          />
        }
      />

      {referrals.isError ? (
        <Alert color="red" title="Referrals unavailable">
          The API rejected the request. Check that it is running and that your
          account is assigned to a clinic.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Awaiting decision"
          value={rows.filter((row) => row.status === "sent").length}
          hint="Sent and not yet accepted"
          tone="orange.7"
        />
        <MetricCard
          label="Accepted"
          value={rows.filter((row) => row.status === "accepted").length}
          hint="Ownership transferred"
          tone="teal.7"
        />
        <MetricCard
          label="Declined"
          value={rows.filter((row) => row.status === "declined").length}
          hint="Returned with a reason"
          tone="red.7"
        />
        <MetricCard
          label="Completed"
          value={rows.filter((row) => row.status === "completed").length}
          hint="Hand-off closed"
        />
      </SimpleGrid>

      <Group>
        <Badge variant="light">{visible.length} referrals</Badge>
      </Group>

      <DataTable
        data={visible}
        columns={columns}
        loading={referrals.isLoading}
        emptyMessage="No referrals in this view"
        minWidth={1080}
      />
    </Stack>
  );
};
