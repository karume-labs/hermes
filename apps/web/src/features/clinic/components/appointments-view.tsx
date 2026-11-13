"use client";

import type { ClinicAppointment } from "@hermes/types";
import { Stack } from "@mantine/core";
import dayjs from "dayjs";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { buildColumns } from "@/features/clinic/components/appointment-columns";
import { AppointmentHeader } from "@/features/clinic/components/appointment-header";
import { AppointmentMetrics } from "@/features/clinic/components/appointment-metrics";
import { AppointmentToolbar } from "@/features/clinic/components/appointment-toolbar";
import { RescheduleAppointmentModal } from "@/features/clinic/components/reschedule-appointment-modal";
import { useClinicAppointments } from "@/features/clinic/services/queries";
import { DataTable } from "@/features/shared/components/table/data-table";

const WINDOWS = ["upcoming", "past", "all"] as const;

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
      <AppointmentHeader isError={appointments.isError} />

      <AppointmentMetrics
        upcoming={upcoming.length}
        today={
          rows.filter(
            (row) => dayjs(row.slot.startAt).format("YYYY-MM-DD") === today,
          ).length
        }
        attended={
          rows.filter((row) => row.booking.status === "attended").length
        }
        cancelled={
          rows.filter(
            (row) =>
              row.booking.status === "cancelled" ||
              row.booking.status === "no_show",
          ).length
        }
        hasNoShow={rows.some((row) => row.booking.status === "no_show")}
      />

      <AppointmentToolbar
        window={window}
        search={search}
        status={status}
        filtersActive={filtersActive}
        onWindow={(next) => void setWindow(next)}
        onSearch={(next) => void setSearch(next)}
        onStatus={(next) => void setStatus(next)}
        onClear={() => {
          void setWindow("upcoming");
          void setSearch("");
          void setStatus("");
        }}
      />

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
