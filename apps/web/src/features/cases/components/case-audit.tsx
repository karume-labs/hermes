"use client";

import type { CaseDetail } from "@hermes/types";
import { Badge, Card, Group, Stack, Table, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface CaseAuditProps {
  detail: CaseDetail;
}

const detailText = (detail: unknown): string => {
  if (detail === null || detail === undefined) return "";
  if (typeof detail === "string") return detail;
  return JSON.stringify(detail);
};

const channelColor = (channel: string): string => {
  if (channel === "push") return "blue";
  if (channel === "sms") return "orange";
  if (channel === "email") return "grape";
  return "gray";
};

export const CaseAudit = ({ detail }: CaseAuditProps): ReactNode => (
  <Stack gap="lg">
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Shared audit trail</Text>
        <Badge variant="light">{detail.audit.length} events</Badge>
      </Group>
      {detail.audit.length === 0 ? (
        <Text size="sm" c="dimmed">
          No audit events yet.
        </Text>
      ) : (
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>When</Table.Th>
              <Table.Th>Actor</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Detail</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {detail.audit.map((entry) => (
              <Table.Tr key={entry.id}>
                <Table.Td>
                  <Text size="xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{entry.actor}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{entry.action}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" maw={320} lineClamp={2}>
                    {detailText(entry.detail)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>

    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Notification history</Text>
        <Badge variant="light">{detail.notifications.length} attempts</Badge>
      </Group>
      {detail.notifications.length === 0 ? (
        <Text size="sm" c="dimmed">
          No notifications queued for this case.
        </Text>
      ) : (
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Channel</Table.Th>
              <Table.Th>Kind</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Attempts</Table.Th>
              <Table.Th>Queued</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {detail.notifications.map((notification) => (
              <Table.Tr key={notification.id}>
                <Table.Td>
                  <Badge
                    color={channelColor(notification.channel)}
                    variant="light"
                  >
                    {notification.channel}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{notification.kind}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{notification.status}</Text>
                </Table.Td>
                <Table.Td>{notification.attempts}</Table.Td>
                <Table.Td>
                  <Text size="xs">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  </Stack>
);
