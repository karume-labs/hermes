"use client";

import {
  Alert,
  Badge,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { referralColumns } from "@/features/clinic/components/referral-columns";
import { useClinicReferrals } from "@/features/clinic/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

export const ReferralsView = (): ReactNode => {
  const [status, setStatus] = useState("all");
  const referrals = useClinicReferrals();
  const rows = referrals.data === undefined ? [] : referrals.data;
  const visible = useMemo(
    () =>
      status === "all" ? rows : rows.filter((row) => row.status === status),
    [rows, status],
  );

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Referral inbox"
        subtitle="Every hand-off into or out of this clinic. Accept, decline or complete decisions on the case file."
        actions={
          <SegmentedControl
            value={status}
            onChange={setStatus}
            data={[
              { value: "all", label: "All" },
              { value: "sent", label: "Sent" },
              { value: "accepted", label: "Accepted" },
              { value: "declined", label: "Declined" },
              { value: "completed", label: "Completed" },
            ]}
          />
        }
      />

      {referrals.isError ? (
        <Alert color="red" title="Referrals unavailable">
          The API rejected the request. Check that it is running and that your
          account is assigned to a clinic.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Awaiting decision"
          value={rows.filter((row) => row.status === "sent").length}
          hint="Sent and not yet accepted"
          tone="orange.7"
        />
        <MetricCard
          label="Accepted"
          value={rows.filter((row) => row.status === "accepted").length}
          hint="Ownership transferred"
          tone="teal.7"
        />
        <MetricCard
          label="Declined"
          value={rows.filter((row) => row.status === "declined").length}
          hint="Returned with a reason"
          tone="red.7"
        />
        <MetricCard
          label="Completed"
          value={rows.filter((row) => row.status === "completed").length}
          hint="Hand-off closed"
        />
      </SimpleGrid>

      <Group>
        <Badge variant="light">{visible.length} referrals</Badge>
      </Group>

      <DataTable
        data={visible}
        columns={referralColumns}
        loading={referrals.isLoading}
        emptyMessage="No referrals in this view"
        minWidth={1080}
      />
    </Stack>
  );
};
