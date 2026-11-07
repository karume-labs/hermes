"use client";

import type { ClinicAppointment } from "@hermes/types";
import { Badge, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { AppointmentActions } from "@/features/clinic/components/appointment-actions";

export const STATUS_COLOR = {
  confirmed: "teal",
  held: "orange",
  attended: "green",
  cancelled: "gray",
  no_show: "red",
} as const;

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
      <Text size="sm" lineClamp={2} maw={320}>
        {row.original.caseSummary}
      </Text>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.booking.status,
    cell: ({ row }) => (
      <Badge
        variant="light"
        color={STATUS_COLOR[row.original.booking.status]}
        tt="capitalize"
      >
        {row.original.booking.status.replace("_", " ")}
      </Badge>
    ),
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
