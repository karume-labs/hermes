"use client";

import type { ReactNode } from "react";
import { statusOf } from "@/features/clinic/components/appointment-columns";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";

const STATUS_OPTIONS = [
  "confirmed",
  "held",
  "attended",
  "cancelled",
  "no_show",
];

type Window = "upcoming" | "past" | "all";

interface AppointmentToolbarProps {
  window: Window;
  search: string;
  status: string;
  filtersActive: boolean;
  onWindow: (value: Window) => void;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onClear: () => void;
}

export const AppointmentToolbar = ({
  window,
  search,
  status,
  filtersActive,
  onWindow,
  onSearch,
  onStatus,
  onClear,
}: AppointmentToolbarProps): ReactNode => (
  <DataToolbar
    title="Find a visit"
    description="Time window, visit status and patient"
    filtersActive={filtersActive}
    activeFilterCount={
      [search, status].filter((entry) => entry !== "").length +
      (window === "upcoming" ? 0 : 1)
    }
    onClear={onClear}
    search={
      <DataToolbarSearch
        value={search}
        onChange={onSearch}
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
        onWindow(next === "past" ? "past" : next === "all" ? "all" : "upcoming")
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
      onChange={(next) => onStatus(next === null ? "" : next)}
      description="Confirmed, held, attended, cancelled or missed."
    />
  </DataToolbar>
);
