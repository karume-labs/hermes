"use client";

import type { ClinicAppointment } from "@hermes/types";
import { Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { AppointmentActions } from "@/features/clinic/components/appointment-actions";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

const STATUS: Record<string, { label: string; tone: Tone; hint: string }> = {
  confirmed: {
    label: "Confirmed",
    tone: "routine",
    hint: "The patient has a reserved slot.",
  },
  held: {
    label: "Held",
    tone: "actionable",
    hint: "Slot reserved while the patient decides.",
  },
  attended: {
    label: "Attended",
    tone: "routine",
    hint: "The visit happened.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "info",
    hint: "Released back to the schedule.",
  },
  no_show: {
    label: "Did not attend",
    tone: "urgent",
    hint: "Nobody arrived for this slot.",
  },
};

interface StatusCopy {
  label: string;
  tone: Tone;
  hint?: string;
}

export const statusOf = (status: string): StatusCopy => {
  const entry = STATUS[status];
  if (entry === undefined) return { label: status, tone: "info" };
  return entry;
};

export const buildColumns = (
  onReschedule: (appointment: ClinicAppointment) => void,
): ColumnDef<ClinicAppointment>[] => [
  {
    id: "when",
    header: "When",
    accessorFn: (row) => row.slot.startAt,
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {dayjs(row.original.slot.startAt).format("ddd D MMM · HH:mm")}
        </Text>
        <Text size="xs" c="dimmed">
          {row.original.slot.kind === "telehealth" ? "Video" : "In person"}
        </Text>
      </Stack>
    ),
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
          {row.original.patientPhone}
        </Text>
      </Stack>
    ),
  },
  {
    id: "reason",
    header: "Reason",
    accessorFn: (row) => row.caseSummary,
    cell: ({ row }) => (
      <Text size="sm" lineClamp={2} maw={300}>
        {row.original.caseSummary}
      </Text>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.booking.status,
    cell: ({ row }) => {
      const status = statusOf(row.original.booking.status);
      return (
        <Pill tone={status.tone} description={status.hint}>
          {status.label}
        </Pill>
      );
    },
  },
  {
    id: "clinic",
    header: "Clinic",
    accessorFn: (row) => row.clinicName,
    cell: ({ row }) => <Text size="sm">{row.original.clinicName}</Text>,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <AppointmentActions
        appointment={row.original}
        onReschedule={onReschedule}
      />
    ),
  },
];
