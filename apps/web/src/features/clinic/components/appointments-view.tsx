"use client";

import type { ClinicAppointment } from "@hermes/types";
import { Alert, SimpleGrid, Stack } from "@mantine/core";
import dayjs from "dayjs";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  buildColumns,
  statusOf,
} from "@/features/clinic/components/appointment-columns";
import { RescheduleAppointmentModal } from "@/features/clinic/components/reschedule-appointment-modal";
import { useClinicAppointments } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const WINDOWS = ["upcoming", "past", "all"] as const;
const STATUS_OPTIONS = [
  "confirmed",
  "held",
  "attended",
  "cancelled",
  "no_show",
];

export const AppointmentsView = (): ReactNode => {
  const [window, setWindow] = useQueryState(
    "when",
    parseAsStringLiteral(WINDOWS).withDefault("upcoming"),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
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

  const term = search.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (window === "upcoming" && !upcoming.includes(row)) return false;
    if (
      window === "past" &&
      (row.booking.status === "confirmed" ||
        new Date(row.slot.startAt).getTime() >= now)
    )
      return false;
    if (status !== "" && row.booking.status !== status) return false;
    if (term === "") return true;
    return (
      row.patientName.toLowerCase().includes(term) ||
      row.patientPhone.toLowerCase().includes(term) ||
      row.clinicName.toLowerCase().includes(term)
    );
  });

  const filtersActive = search !== "" || status !== "" || window !== "upcoming";

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Appointments"
        subtitle="Every booked, attended and cancelled visit, with the result behind it."
      />

      {appointments.isError ? (
        <Alert color="red" title="The schedule could not load">
          The dashboard could not reach the care API, or your account is not
          attached to a clinic yet.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Coming up"
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
          hint="On today's list"
        />
        <MetricCard
          label="Attended"
          value={rows.filter((row) => row.booking.status === "attended").length}
          hint="Visits that happened"
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
          emphasis={
            rows.some((row) => row.booking.status === "no_show")
              ? "attention"
              : "none"
          }
        />
      </SimpleGrid>

      <DataToolbar
        title="Find a visit"
        description="Time window, visit status and patient"
        filtersActive={filtersActive}
        activeFilterCount={
          [search, status].filter((entry) => entry !== "").length +
          (window === "upcoming" ? 0 : 1)
        }
        onClear={() => {
          void setWindow("upcoming");
          void setSearch("");
          void setStatus("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search a patient, phone number or clinic"
          />
        }
      >
        <DataToolbarSelect
          label="Time window"
          placeholder="Upcoming"
          data={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
            { value: "all", label: "Everything" },
          ]}
          value={window}
          onChange={(next) =>
            void setWindow(
              next === "past" ? "past" : next === "all" ? "all" : "upcoming",
            )
          }
          description="Where the visit sits relative to now."
        />
        <DataToolbarSelect
          label="Visit status"
          placeholder="Any status"
          data={STATUS_OPTIONS.map((key) => ({
            value: key,
            label: statusOf(key).label,
          }))}
          value={status === "" ? null : status}
          onChange={(next) => void setStatus(next === null ? "" : next)}
          description="Confirmed, held, attended, cancelled or missed."
        />
      </DataToolbar>

      <DataTable
        data={visible}
        columns={columns}
        loading={appointments.isLoading}
        emptyMessage="No visits in this view"
        onClearFilters={() => {
          void setWindow("upcoming");
          void setSearch("");
          void setStatus("");
        }}
        minWidth={1040}
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
