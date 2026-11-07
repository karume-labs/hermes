"use client";

import { Alert, SimpleGrid, Stack } from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { referralColumns } from "@/features/clinic/components/referral-columns";
import { useClinicReferrals } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const STATUS_OPTIONS = [
  { value: "sent", label: "Waiting on the other clinic" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "completed", label: "Completed" },
];

export const ReferralsView = (): ReactNode => {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const referrals = useClinicReferrals();
  const rows = referrals.data === undefined ? [] : referrals.data;

  const term = search.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (status !== "" && row.status !== status) return false;
    if (term === "") return true;
    return (
      row.patientName.toLowerCase().includes(term) ||
      row.fromClinicName.toLowerCase().includes(term) ||
      row.toClinicName.toLowerCase().includes(term)
    );
  });

  const filtersActive = search !== "" || status !== "";

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Referrals"
        subtitle="Hand-offs into and out of this clinic. Accept, decline or complete them on the case file."
      />

      {referrals.isError ? (
        <Alert color="red" title="Referrals could not load">
          The dashboard could not reach the care API, or your account is not
          attached to a clinic yet.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Waiting on a reply"
          value={rows.filter((row) => row.status === "sent").length}
          hint="Sent and not answered"
          emphasis={
            rows.some((row) => row.status === "sent") ? "attention" : "none"
          }
        />
        <MetricCard
          label="Accepted"
          value={rows.filter((row) => row.status === "accepted").length}
          hint="Another clinic owns the next step"
        />
        <MetricCard
          label="Declined"
          value={rows.filter((row) => row.status === "declined").length}
          hint="Came back with a reason"
          emphasis={
            rows.some((row) => row.status === "declined") ? "alert" : "none"
          }
        />
        <MetricCard
          label="Completed"
          value={rows.filter((row) => row.status === "completed").length}
          hint="Hand-off finished"
        />
      </SimpleGrid>

      <DataToolbar
        title="Find a referral"
        description="Status and clinic"
        filtersActive={filtersActive}
        activeFilterCount={
          [search, status].filter((entry) => entry !== "").length
        }
        onClear={() => {
          void setStatus("");
          void setSearch("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search a patient or clinic"
          />
        }
      >
        <DataToolbarSelect
          label="Status"
          placeholder="Any status"
          data={STATUS_OPTIONS}
          value={status === "" ? null : status}
          onChange={(next) => void setStatus(next === null ? "" : next)}
          description="Where the hand-off stands right now."
        />
      </DataToolbar>

      <DataTable
        data={visible}
        columns={referralColumns}
        loading={referrals.isLoading}
        emptyMessage="No referrals match these filters"
        onClearFilters={() => {
          void setStatus("");
          void setSearch("");
        }}
        minWidth={1020}
      />
    </Stack>
  );
};
