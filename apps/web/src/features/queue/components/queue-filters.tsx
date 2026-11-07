"use client";

import { Badge, Select, Switch } from "@mantine/core";
import type { ReactNode } from "react";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";

const severityOptions = ["Routine", "Actionable", "Urgent"];
const statusOptions = [
  "received",
  "triaged",
  "notified",
  "acknowledged",
  "appointment_booked",
  "referred",
  "escalated",
  "closed",
];

export interface QueueFilterState {
  severity: string;
  status: string;
  ownership: string;
  overdue: string;
}

export const QueueFilters = ({
  value,
  count,
  filtersActive,
  onChange,
}: {
  value: QueueFilterState;
  count: number;
  filtersActive: boolean;
  onChange: (patch: Partial<QueueFilterState>) => void;
}): ReactNode => {
  const activeCount = [
    value.severity,
    value.status,
    value.ownership,
    value.overdue,
  ].filter((entry) => entry !== "").length;

  return (
    <DataToolbar
      title="Active cases"
      description="Filter by clinical severity or workflow status"
      meta={<Badge variant="light">{count}</Badge>}
      filtersActive={filtersActive}
      activeFilterCount={activeCount}
      onClear={() => {
        onChange({ severity: "", status: "", ownership: "", overdue: "" });
      }}
    >
      <Select
        label="Severity"
        placeholder="All severities"
        value={value.severity === "" ? null : value.severity}
        onChange={(next) => onChange({ severity: next ?? "" })}
        data={severityOptions}
        clearable
      />
      <Select
        label="Ownership"
        placeholder="Everyone"
        value={value.ownership === "" ? null : value.ownership}
        onChange={(next) => onChange({ ownership: next ?? "" })}
        data={[
          { value: "mine", label: "My cases" },
          { value: "unassigned", label: "Unassigned" },
        ]}
        clearable
      />
      <Switch
        label="Overdue only"
        checked={value.overdue === "true"}
        onChange={(event) =>
          onChange({ overdue: event.currentTarget.checked ? "true" : "" })
        }
      />
      <Select
        label="Workflow status"
        placeholder="All statuses"
        value={value.status === "" ? null : value.status}
        onChange={(next) => onChange({ status: next ?? "" })}
        data={statusOptions}
        clearable
      />
    </DataToolbar>
  );
};
