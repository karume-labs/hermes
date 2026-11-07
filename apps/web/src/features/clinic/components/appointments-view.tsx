"use client";

import type { ClinicAppointment } from "@hermes/types";
import {
  Alert,
  Anchor,
  Badge,
  Button,
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
import { RescheduleAppointmentModal } from "@/features/clinic/components/reschedule-appointment-modal";
import {
  useCancelClinicBooking,
  useRecordBookingOutcome,
} from "@/features/clinic/services/mutations";
import { useClinicAppointments } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const STATUS_COLOR = {
  confirmed: "teal",
  held: "orange",
  attended: "green",
  cancelled: "gray",
  no_show: "red",
} as const;

const AppointmentActions = ({
  appointment,
  onReschedule,
}: {
  appointment: ClinicAppointment;
  onReschedule: (appointment: ClinicAppointment) => void;
}): ReactNode => {
  const cancel = useCancelClinicBooking();
  const outcome = useRecordBookingOutcome();
  const started = new Date(appointment.slot.startAt).getTime() <= Date.now();
  const confirmed = appointment.booking.status === "confirmed";

  return (
    <Group gap={4} wrap="nowrap">
      <Anchor
        component={Link}
        href={`/cases/${appointment.booking.caseId}`}
        size="sm"
        fw={600}
      >
        Open case
      </Anchor>
      {confirmed && !started ? (
        <>
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => onReschedule(appointment)}
          >
            Reschedule
          </Button>
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            loading={cancel.isPending}
            onClick={() => cancel.mutate(appointment.booking.id)}
          >
            Cancel
          </Button>
        </>
      ) : null}
      {confirmed && started ? (
        <>
          <Button
            size="compact-xs"
            variant="light"
            color="teal"
            loading={outcome.isPending}
            onClick={() =>
              outcome.mutate({
                bookingId: appointment.booking.id,
                status: "attended",
              })
            }
          >
            Attended
          </Button>
          <Button
            size="compact-xs"
            variant="light"
            color="red"
            loading={outcome.isPending}
            onClick={() =>
              outcome.mutate({
                bookingId: appointment.booking.id,
                status: "no_show",
              })
            }
          >
            No-show
          </Button>
        </>
      ) : null}
    </Group>
  );
};

const buildColumns = (
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

export const AppointmentsView = (): ReactNode => {
  const [view, setView] = useState("upcoming");
  const [rescheduling, setRescheduling] = useState<ClinicAppointment | null>(
    null,
  );
  const columns = useMemo(() => buildColumns(setRescheduling), []);
  const appointments = useClinicAppointments();
  const rows = appointments.data === undefined ? [] : appointments.data;
  const now = Date.now();
  const today = dayjs().format("YYYY-MM-DD");
  const upcoming = rows.filter(
    (row) =>
      row.booking.status === "confirmed" &&
      new Date(row.slot.startAt).getTime() >= now,
  );
  const visible = useMemo(() => {
    if (view === "upcoming") return upcoming;
    if (view === "past") {
      return rows.filter(
        (row) =>
          row.booking.status !== "confirmed" ||
          new Date(row.slot.startAt).getTime() < now,
      );
    }
    return rows;
  }, [now, rows, upcoming, view]);

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Clinic schedule"
        subtitle="Every booked, attended and cancelled visit with the patient and result behind it. Refreshed every 30 seconds."
        actions={
          <SegmentedControl
            value={view}
            onChange={setView}
            data={[
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
              { value: "all", label: "All" },
            ]}
          />
        }
      />

      {appointments.isError ? (
        <Alert color="red" title="Schedule unavailable">
          The API rejected the request. Check that it is running and that your
          account is assigned to a clinic.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Upcoming"
          value={upcoming.length}
          hint="Confirmed visits ahead"
        />
        <MetricCard
          label="Today"
          value={
            rows.filter(
              (row) => dayjs(row.slot.startAt).format("YYYY-MM-DD") === today,
            ).length
          }
          hint="Visits on today's list"
        />
        <MetricCard
          label="Attended"
          value={rows.filter((row) => row.booking.status === "attended").length}
          hint="Completed visits"
          tone="teal.7"
        />
        <MetricCard
          label="Cancelled or missed"
          value={
            rows.filter(
              (row) =>
                row.booking.status === "cancelled" ||
                row.booking.status === "no_show",
            ).length
          }
          hint="Released slots and no-shows"
          tone="orange.7"
        />
      </SimpleGrid>

      <Group>
        <Badge variant="light">{visible.length} visits</Badge>
      </Group>

      <DataTable
        data={visible}
        columns={columns}
        loading={appointments.isLoading}
        emptyMessage="No visits in this view"
        minWidth={1080}
        rowClassName={(row) =>
          row.booking.status === "cancelled" ? "hermes-row-muted" : undefined
        }
      />

      <RescheduleAppointmentModal
        appointment={rescheduling}
        onClose={() => setRescheduling(null)}
      />
    </Stack>
  );
};
