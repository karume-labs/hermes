"use client";

import type { ClinicAppointment } from "@hermes/types";
import {
  Alert,
  Badge,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { buildColumns } from "@/features/clinic/components/appointment-columns";
import { RescheduleAppointmentModal } from "@/features/clinic/components/reschedule-appointment-modal";
import { useClinicAppointments } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

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
