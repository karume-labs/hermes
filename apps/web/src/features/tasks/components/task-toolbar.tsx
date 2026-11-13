"use client";

import type { ReactNode } from "react";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { TASK_KIND_OPTIONS } from "@/features/tasks/components/task-kind-options";

interface TaskToolbarProps {
  search: string;
  kind: string;
  status: string;
  filtersActive: boolean;
  onSearch: (value: string) => void;
  onKind: (value: string) => void;
  onStatus: (value: string) => void;
  onClear: () => void;
}

export const TaskToolbar = ({
  search,
  kind,
  status,
  filtersActive,
  onSearch,
  onKind,
  onStatus,
  onClear,
}: TaskToolbarProps): ReactNode => (
  <DataToolbar
    title="Find a task"
    description="Kind, status and free text"
    filtersActive={filtersActive}
    activeFilterCount={
      [search, kind].filter((entry) => entry !== "").length +
      (status === "open" ? 0 : 1)
    }
    onClear={onClear}
    search={
      <DataToolbarSearch
        value={search}
        onChange={onSearch}
        placeholder="Search a task or its detail"
      />
    }
  >
    <DataToolbarSelect
      label="Kind"
      placeholder="Any kind"
      data={TASK_KIND_OPTIONS}
      value={kind === "" ? null : kind}
      onChange={(next) => onKind(next === null ? "" : next)}
      description="What created the task."
    />
    <DataToolbarSelect
      label="Status"
      placeholder="Open"
      data={[
        { value: "open", label: "Open" },
        { value: "done", label: "Done" },
      ]}
      value={status}
      onChange={(next) => onStatus(next === null ? "open" : next)}
      description="Done tasks stay listed until you clear the filter."
    />
  </DataToolbar>
);
