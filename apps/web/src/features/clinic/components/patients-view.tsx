"use client";

import { Alert, SimpleGrid, Stack } from "@mantine/core";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { patientColumns } from "@/features/clinic/components/patient-columns";
import { useClinicPatients } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const SORTS = ["newest", "oldest"] as const;

export const PatientsView = (): ReactNode => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [load, setLoad] = useQueryState("load", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("newest"),
  );
  const patients = useClinicPatients();
  const rows = patients.data === undefined ? [] : patients.data;

  const term = search.trim().toLowerCase();
  const visible = rows
    .filter((row) => {
      if (load === "open" && row.activeCaseCount === 0) return false;
      if (load === "quiet" && row.activeCaseCount > 0) return false;
      if (term === "") return true;
      return (
        row.name.toLowerCase().includes(term) ||
        row.phone.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term)
      );
    })
    .sort((left, right) => {
      const leftAt = left.lastCaseAt === null ? 0 : Date.parse(left.lastCaseAt);
      const rightAt =
        right.lastCaseAt === null ? 0 : Date.parse(right.lastCaseAt);
      return sort === "newest" ? rightAt - leftAt : leftAt - rightAt;
    });

  const filtersActive = search !== "" || load !== "";

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Patients"
        subtitle="Everyone registered at your clinic, with how much care is still open and the latest result on file."
      />

      {patients.isError ? (
        <Alert color="red" title="Patients could not load">
          The dashboard could not reach the care API, or your account is not
          attached to a clinic yet.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <MetricCard
          label="Patients"
          value={rows.length}
          hint="Registered at this clinic"
        />
        <MetricCard
          label="Open results"
          value={rows.reduce((sum, row) => sum + row.activeCaseCount, 0)}
          hint="Still waiting on a next step"
          emphasis={
            rows.reduce((sum, row) => sum + row.activeCaseCount, 0) > 0
              ? "attention"
              : "none"
          }
        />
        <MetricCard
          label="With a result on file"
          value={rows.filter((row) => row.lastCaseAt !== null).length}
          hint="At least one screening result"
        />
      </SimpleGrid>

      <DataToolbar
        title="Find a patient"
        description="Search the roster or narrow it by care load"
        filtersActive={filtersActive}
        activeFilterCount={
          [search, load].filter((entry) => entry !== "").length
        }
        sort={sort}
        onSortChange={(next) => void setSort(next)}
        onClear={() => {
          void setSearch("");
          void setLoad("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search a name, phone number or patient ID"
            description="Matches anyone already on this clinic's roster."
          />
        }
      >
        <DataToolbarSelect
          label="Care load"
          placeholder="Everyone"
          data={[
            { value: "open", label: "Has open results" },
            { value: "quiet", label: "Nothing open" },
          ]}
          value={load === "" ? null : load}
          onChange={(next) => void setLoad(next === null ? "" : next)}
          description="Open means a result has not been closed yet."
        />
      </DataToolbar>

      <DataTable
        data={visible}
        columns={patientColumns}
        loading={patients.isLoading}
        emptyMessage="No patients match these filters"
        onClearFilters={() => {
          void setSearch("");
          void setLoad("");
        }}
        minWidth={860}
      />
    </Stack>
  );
};
