"use client";

import { Badge, Group, Table, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useWebhookLogs } from "@/features/admin/services/queries";

export const WebhookLogTable = (): ReactNode => {
  const logs = useWebhookLogs();
  const entries = logs.data === undefined ? [] : logs.data;
  const accepted = entries.filter((entry) => entry.ok).length;
  const rejected = entries.length - accepted;

  return (
    <>
      <Group justify="space-between">
        <Title order={3}>Lab webhook log</Title>
        <Text size="xs" c="dimmed">
          {entries.length} calls · {accepted} accepted · {rejected} rejected
        </Text>
      </Group>
      {entries.length === 0 ? (
        <Text size="sm" c="dimmed">
          No lab feeds received yet. POST a FHIR Observation to /webhooks/fhir
          or an HL7 ORU to /webhooks/hl7.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={640}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Source</Table.Th>
                <Table.Th>Result</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Detail</Table.Th>
                <Table.Th>Received</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{entry.source}</Table.Td>
                  <Table.Td>
                    <Badge color={entry.ok ? "teal" : "red"} variant="light">
                      {entry.ok ? "accepted" : "rejected"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{entry.status}</Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" maw={260} lineClamp={2}>
                      {JSON.stringify(entry.detail)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
};
