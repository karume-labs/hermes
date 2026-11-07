"use client";

import type { ClinicReferral } from "@hermes/types";
import { Anchor, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Link from "next/link";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

interface ReferralStatus {
  label: string;
  tone: Tone;
  hint: string;
}

const STATUS: Record<string, ReferralStatus> = {
  sent: {
    label: "Waiting on the other clinic",
    tone: "actionable",
    hint: "The hand-off has been sent and not answered yet.",
  },
  accepted: {
    label: "Accepted",
    tone: "routine",
    hint: "The receiving clinic owns the next step.",
  },
  declined: {
    label: "Declined",
    tone: "urgent",
    hint: "The receiving clinic could not take this on.",
  },
  completed: {
    label: "Completed",
    tone: "info",
    hint: "The hand-off is finished.",
  },
};

const copyFor = (status: string): ReferralStatus => {
  const entry = STATUS[status];
  if (entry === undefined)
    return { label: status, tone: "info", hint: "Referral status" };
  return entry;
};

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
    cell: ({ row }) => {
      const entry = copyFor(row.original.status);
      return (
        <Pill tone={entry.tone} description={entry.hint}>
          {entry.label}
        </Pill>
      );
    },
  },
  {
    id: "note",
    header: "Hand-off note",
    accessorFn: (row) => row.note,
    cell: ({ row }) => (
      <Text size="sm" lineClamp={2} maw={320}>
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
