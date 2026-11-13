"use client";

import { Alert, Card, Stack, Text } from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { deliveryColumns } from "@/features/admin/components/delivery-columns";
import { DeliveryHeader } from "@/features/admin/components/delivery-header";
import { DeliveryMetrics } from "@/features/admin/components/delivery-metrics";
import type { NotificationRow } from "@/features/admin/components/delivery-view-types";
import { WebhookLogTable } from "@/features/admin/components/webhook-log-table";
import { useDispatchNotifications } from "@/features/admin/services/mutations";
import {
  useNotificationStats,
  useRecentNotifications,
} from "@/features/admin/services/queries";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";

const CHANNELS = [
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
  { value: "in_app", label: "In-app" },
  { value: "email", label: "Email" },
];

export const DeliveryView = (): ReactNode => {
  const [channel, setChannel] = useQueryState(
    "channel",
    parseAsString.withDefault(""),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const notifications = useRecentNotifications();
  const stats = useNotificationStats();
  const dispatch = useDispatchNotifications();

  const items: NotificationRow[] =
    notifications.data === undefined ? [] : notifications.data;
  const term = search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (channel !== "" && item.channel !== channel) return false;
    if (term === "") return true;
    return (
      item.caseId.toLowerCase().includes(term) ||
      item.kind.toLowerCase().includes(term)
    );
  });
  const failures = items.filter((item) => item.status === "failed");

  const columns = useMemo(() => deliveryColumns, []);

  const statValue = (
    key: "queued" | "sent" | "read" | "failed" | "smsQueued",
  ) => (stats.data === undefined ? 0 : stats.data[key]);

  return (
    <Stack gap="xl">
      <DeliveryHeader
        isPending={dispatch.isPending}
        onRun={() => dispatch.mutate()}
      />

      {notifications.isError || stats.isError ? (
        <Alert color="red" title="Delivery log unavailable">
          Start the API with <code>bun run dev:api</code>.
        </Alert>
      ) : null}

      <DeliveryMetrics
        queued={statValue("queued")}
        sent={statValue("sent")}
        read={statValue("read")}
        failed={statValue("failed")}
        smsQueued={statValue("smsQueued")}
        failureCount={failures.length}
        failureMessage={
          failures.length === 0 || failures[0].error === null
            ? null
            : `${failures[0].caseId.slice(0, 8)}: ${failures[0].error}`
        }
      />

      {dispatch.isSuccess ? (
        <Alert color="teal">
          Outbox drained: {dispatch.data.delivered} notification(s) delivered.
        </Alert>
      ) : null}

      <Card
        radius="lg"
        p="lg"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <Stack gap="lg">
          <Stack gap={2}>
            <Text fw={700}>Notification outbox</Text>
            <Text size="sm" c="dimmed">
              Every push, SMS and in-app notice queued so far.
            </Text>
          </Stack>

          <DataToolbar
            title="Find a message"
            description="Channel and case"
            filtersActive={channel !== "" || search !== ""}
            activeFilterCount={
              [channel, search].filter((entry) => entry !== "").length
            }
            onClear={() => {
              void setChannel("");
              void setSearch("");
            }}
            search={
              <DataToolbarSearch
                value={search}
                onChange={(next) => void setSearch(next)}
                placeholder="Search a case reference or message kind"
              />
            }
          >
            <DataToolbarSelect
              label="Channel"
              placeholder="Every channel"
              data={CHANNELS}
              value={channel === "" ? null : channel}
              onChange={(next) => void setChannel(next === null ? "" : next)}
              description="Where the notice is delivered."
            />
          </DataToolbar>

          <DataTable
            data={filtered}
            columns={columns}
            minWidth={840}
            pageSize={10}
            emptyMessage="No notifications in this channel"
          />
        </Stack>
      </Card>

      <WebhookLogTable />
    </Stack>
  );
};
