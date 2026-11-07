"use client";

import { Badge, Checkbox } from "@mantine/core";
import type { ReactNode } from "react";
import {
  DataToolbar,
  type ToolbarSort,
} from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";

const SEVERITY_OPTIONS = [
  { value: "urgent", label: "Urgent — 4 hours" },
  { value: "actionable", label: "Actionable — 24 hours" },
  { value: "routine", label: "Routine — 72 hours" },
];

const STATUS_OPTIONS = [
  { value: "received", label: "Result received" },
  { value: "triaged", label: "Triaged" },
  { value: "notified", label: "Message sent" },
  { value: "acknowledged", label: "Patient confirmed" },
  { value: "appointment_booked", label: "Visit booked" },
  { value: "referred", label: "Referred" },
  { value: "escalated", label: "Escalated" },
  { value: "closed", label: "Closed" },
];

export interface QueueFilterState {
  severity: string;
  status: string;
  ownership: string;
  overdue: string;
  search: string;
}

interface QueueFiltersProps {
  value: QueueFilterState;
  filtersActive: boolean;
  sort: ToolbarSort;
  onChange: (patch: Partial<QueueFilterState>) => void;
  onSortChange: (sort: ToolbarSort) => void;
  onClear: () => void;
}

export const QueueFilters = ({
  value,
  filtersActive,
  sort,
  onChange,
  onSortChange,
  onClear,
}: QueueFiltersProps): ReactNode => {
  const activeCount = [
    value.severity,
    value.status,
    value.ownership,
    value.overdue,
    value.search,
  ].filter((entry) => entry !== "").length;

  return (
    <DataToolbar
      title="Narrow the queue"
      description="Severity, stage, owner and deadline"
      meta={
        <Badge variant="outline" color="ink" size="xs">
          {value.search === "" ? "All results" : "Filtered"}
        </Badge>
      }
      filtersActive={filtersActive}
      activeFilterCount={activeCount}
      sort={sort}
      onSortChange={onSortChange}
      onClear={onClear}
      search={
        <DataToolbarSearch
          value={value.search}
          onChange={(next) => onChange({ search: next })}
          placeholder="Search a patient, phone number or case reference"
          description="Searches the cases already in view."
        />
      }
    >
      <DataToolbarSelect
        label="Severity"
        placeholder="Any severity"
        data={SEVERITY_OPTIONS}
        value={value.severity === "" ? null : value.severity}
        onChange={(next) => onChange({ severity: next === null ? "" : next })}
        description="How fast the result needs a clinical decision."
      />
      <DataToolbarSelect
        label="Stage"
        placeholder="Any stage"
        data={STATUS_OPTIONS}
        value={value.status === "" ? null : value.status}
        onChange={(next) => onChange({ status: next === null ? "" : next })}
        description="Where this result sits on its way to sign-off."
      />
      <DataToolbarSelect
        label="Owner"
        placeholder="Anyone"
        data={[
          { value: "mine", label: "Assigned to me" },
          { value: "unassigned", label: "No owner yet" },
        ]}
        value={value.ownership === "" ? null : value.ownership}
        onChange={(next) => onChange({ ownership: next === null ? "" : next })}
        description="Cases without an owner are the first to slip."
      />
      <Checkbox
        label="Only cases past their deadline"
        checked={value.overdue === "true"}
        onChange={(event) =>
          onChange({ overdue: event.currentTarget.checked ? "true" : "" })
        }
      />
    </DataToolbar>
  );
};
