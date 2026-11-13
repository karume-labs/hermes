"use client";

import type { AdminClinicSummary } from "@hermes/types";
import { Alert, Button, Stack } from "@mantine/core";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { buildClinicColumns } from "@/features/admin/components/clinic-columns";
import { ClinicFormModal } from "@/features/admin/components/clinic-form-modal";
import { ClinicMetrics } from "@/features/admin/components/clinic-metrics";
import { useAdminClinics } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";

const SORTS = ["newest", "oldest"] as const;

export const ClinicsView = (): ReactNode => {
  const clinics = useAdminClinics();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminClinicSummary | null>(null);
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [state, setState] = useQueryState(
    "state",
    parseAsString.withDefault(""),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("newest"),
  );
  const rows = clinics.data === undefined ? [] : clinics.data;
  const columns = useMemo(
    () =>
      buildClinicColumns((clinic) => {
        setEditing(clinic);
        setFormOpen(true);
      }),
    [],
  );

  const term = search.trim().toLowerCase();
  const visible = rows
    .filter((row) => {
      if (state === "active" && !row.isActive) return false;
      if (state === "paused" && row.isActive) return false;
      if (term === "") return true;
      return (
        row.name.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term) ||
        row.timezone.toLowerCase().includes(term)
      );
    })
    .sort((left, right) =>
      sort === "newest"
        ? left.name.localeCompare(right.name)
        : right.name.localeCompare(left.name),
    );

  const filtersActive = search !== "" || state !== "";

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Clinics"
        subtitle="Every clinic in the network, who works there and how much care is open."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add clinic
          </Button>
        }
      />

      {clinics.isError ? (
        <Alert color="red" title="Clinics could not load">
          Only an administrator can read the network directory.
        </Alert>
      ) : null}

      <ClinicMetrics rows={rows} />

      <DataToolbar
        title="Find a clinic"
        description="Name, tenancy and status"
        filtersActive={filtersActive}
        activeFilterCount={
          [search, state].filter((entry) => entry !== "").length
        }
        sort={sort}
        onSortChange={(next) => void setSort(next)}
        onClear={() => {
          void setSearch("");
          void setState("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search a clinic name, ID or timezone"
          />
        }
      >
        <DataToolbarSelect
          label="Status"
          placeholder="Any status"
          data={[
            { value: "active", label: "Open" },
            { value: "paused", label: "Paused" },
          ]}
          value={state === "" ? null : state}
          onChange={(next) => void setState(next === null ? "" : next)}
          description="Paused clinics keep their data but receive no new results."
        />
      </DataToolbar>

      <DataTable
        data={visible}
        columns={columns}
        loading={clinics.isLoading}
        emptyMessage="No clinics match these filters"
        onClearFilters={() => {
          void setSearch("");
          void setState("");
        }}
        minWidth={920}
      />

      <ClinicFormModal
        opened={formOpen}
        clinic={editing}
        onClose={() => setFormOpen(false)}
      />
    </Stack>
  );
};
