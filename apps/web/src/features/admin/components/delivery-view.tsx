"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { WebhookLogTable } from "@/features/admin/components/webhook-log-table";
import { useDispatchNotifications } from "@/features/admin/services/mutations";
import {
  useNotificationStats,
  useRecentNotifications,
} from "@/features/admin/services/queries";

const statusColor = (status: string): string => {
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

  const items = notifications.data === undefined ? [] : notifications.data;
  const filtered =
    channel === "all"
      ? items
      : items.filter((item) => item.channel === channel);
  const failures = items.filter((item) => item.status === "failed");

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Delivery &amp; integrations</Title>
          <Text size="sm" c="dimmed">
            Push, SMS fallback, webhook intake and lab-feed health.
          </Text>
        </div>
        <Button
          variant="light"
          loading={dispatch.isPending}
          onClick={() => dispatch.mutate()}
        >
          Run outbox now
        </Button>
      </Group>

      {(notifications.isError || stats.isError) && (
        <Alert color="red" title="Delivery log unavailable">
          Start the API with <code>bun run dev:api</code>.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 2, sm: 5 }}>
        {[
          ["Queued", stats.data === undefined ? 0 : stats.data.queued],
          ["Sent", stats.data === undefined ? 0 : stats.data.sent],
          ["Read", stats.data === undefined ? 0 : stats.data.read],
          ["Failed", stats.data === undefined ? 0 : stats.data.failed],
          ["SMS fallback", stats.data === undefined ? 0 : stats.data.smsQueued],
        ].map(([label, value]) => (
          <Card withBorder key={label}>
            <Text size="xs" c="dimmed">
              {label}
            </Text>
            <Text size="xl" fw={700}>
              {value}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {dispatch.isSuccess && (
        <Alert color="teal">
          Outbox drained: {dispatch.data.delivered} notification(s) delivered.
        </Alert>
      )}

      {failures.length > 0 && (
        <Alert color="orange" title={`${failures.length} failed deliveries`}>
          {failures[0].error === null
            ? "Inspect the failed rows below."
            : `${failures[0].caseId.slice(0, 8)}: ${failures[0].error}`}
        </Alert>
      )}

      <SegmentedControl
        value={channel}
        onChange={setChannel}
        data={channels.map((value) => ({ value, label: value }))}
        w="fit-content"
      />

      <Table.ScrollContainer minWidth={720}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Case</Table.Th>
              <Table.Th>Channel</Table.Th>
              <Table.Th>Kind</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Attempts</Table.Th>
              <Table.Th>Queued</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text size="xs" ff="monospace">
                    {item.caseId.slice(0, 8)}
                  </Text>
                </Table.Td>
                <Table.Td>{item.channel}</Table.Td>
                <Table.Td>
                  <Text size="xs">{item.kind}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={statusColor(item.status)} variant="light">
                    {item.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{item.attempts}</Table.Td>
                <Table.Td>
                  <Text size="xs">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <WebhookLogTable />
    </Stack>
  );
};
