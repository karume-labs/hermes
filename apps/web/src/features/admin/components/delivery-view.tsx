"use client";

import {
  Alert,
  Button,
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { deliveryColumns } from "@/features/admin/components/delivery-columns";
import type { NotificationRow } from "@/features/admin/components/delivery-view-types";
import { WebhookLogTable } from "@/features/admin/components/webhook-log-table";
import { useDispatchNotifications } from "@/features/admin/services/mutations";
import {
  useNotificationStats,
  useRecentNotifications,
} from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const _statusColor = (status: string): string => {
  if (status === "sent") return "teal";
  if (status === "read") return "blue";
  if (status === "failed") return "red";
  return "yellow";
};

const channels = ["all", "push", "sms", "in_app", "email"];

export const DeliveryView = (): ReactNode => {
  const [channel, setChannel] = useState("all");
  const notifications = useRecentNotifications();
  const stats = useNotificationStats();
  const dispatch = useDispatchNotifications();

  const items: NotificationRow[] =
    notifications.data === undefined ? [] : notifications.data;
  const filtered =
    channel === "all"
      ? items
      : items.filter((item) => item.channel === channel);
  const failures = items.filter((item) => item.status === "failed");

  const columns = useMemo(() => deliveryColumns, []);

  const statValue = (
    key: "queued" | "sent" | "read" | "failed" | "smsQueued",
  ) => (stats.data === undefined ? 0 : stats.data[key]);

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Delivery & integrations"
        subtitle="Push, SMS fallback, webhook intake and lab-feed health."
        actions={
          <Button
            leftSection={<IconSend size={16} />}
            loading={dispatch.isPending}
            onClick={() => dispatch.mutate()}
          >
            Run outbox now
          </Button>
        }
      />

      {notifications.isError || stats.isError ? (
        <Alert color="red" title="Delivery log unavailable">
          Start the API with <code>bun run dev:api</code>.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
        <MetricCard label="Queued" value={statValue("queued")} />
        <MetricCard label="Sent" value={statValue("sent")} />
        <MetricCard label="Read" value={statValue("read")} />
        <MetricCard
          label="Failed"
          value={statValue("failed")}
          tone={statValue("failed") > 0 ? "red.7" : "brandSlate.9"}
        />
        <MetricCard label="SMS fallback" value={statValue("smsQueued")} />
      </SimpleGrid>

      {dispatch.isSuccess ? (
        <Alert color="teal">
          Outbox drained: {dispatch.data.delivered} notification(s) delivered.
        </Alert>
      ) : null}

      {failures.length > 0 ? (
        <Alert color="orange" title={`${failures.length} failed deliveries`}>
          {failures[0].error === null
            ? "Inspect the failed rows in the outbox table."
            : `${failures[0].caseId.slice(0, 8)}: ${failures[0].error}`}
        </Alert>
      ) : null}

      <Card
        radius="sm"
        p="lg"
        bg="brandChalk.0"
        bd="1px solid var(--mantine-color-brandChalk-3)"
      >
        <Stack gap="lg">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={500}>Notification outbox</Text>
              <Text size="sm" c="dimmed">
                Every push, SMS and in-app notice the loop has queued.
              </Text>
            </Stack>
            <SegmentedControl
              size="xs"
              value={channel}
              onChange={setChannel}
              data={channels.map((value) => ({ value, label: value }))}
            />
          </Group>

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
