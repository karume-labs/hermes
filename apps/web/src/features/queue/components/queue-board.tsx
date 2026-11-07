"use client";

import type { CaseListItem } from "@hermes/types";
import { Card, Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { QueueRow } from "@/features/queue/components/queue-row";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

interface Lane {
  key: string;
  title: string;
  hint: string;
  tone: Tone;
  items: CaseListItem[];
}

const overdueItems = (cases: CaseListItem[]): CaseListItem[] =>
  cases.filter(
    (item) =>
      item.status !== "closed" &&
      item.acknowledgedAt === null &&
      new Date(item.slaDueAt).getTime() < Date.now(),
  );

const dueSoonItems = (cases: CaseListItem[]): CaseListItem[] =>
  cases.filter((item) => {
    if (item.status === "closed" || item.acknowledgedAt !== null) return false;
    const remaining = new Date(item.slaDueAt).getTime() - Date.now();
    return remaining >= 0 && remaining < 60 * 60 * 1000;
  });

const onTrackItems = (cases: CaseListItem[]): CaseListItem[] =>
  cases.filter((item) => {
    if (item.status === "closed") return false;
    const remaining = new Date(item.slaDueAt).getTime() - Date.now();
    return item.acknowledgedAt !== null || remaining >= 60 * 60 * 1000;
  });

const sortedByDeadline = (items: CaseListItem[]): CaseListItem[] =>
  [...items].sort(
    (left, right) =>
      new Date(left.slaDueAt).getTime() - new Date(right.slaDueAt).getTime(),
  );

const buildLanes = (cases: CaseListItem[]): Lane[] => [
  {
    key: "overdue",
    title: "Past the window",
    hint: "No patient confirmation and the deadline has gone.",
    tone: "urgent",
    items: sortedByDeadline(overdueItems(cases)),
  },
  {
    key: "due-soon",
    title: "Due within the hour",
    hint: "Still time to act if you start now.",
    tone: "actionable",
    items: sortedByDeadline(dueSoonItems(cases)),
  },
  {
    key: "track",
    title: "On track",
    hint: "Confirmed by the patient or comfortably inside the window.",
    tone: "routine",
    items: sortedByDeadline(onTrackItems(cases)),
  },
];

interface QueueBoardProps {
  cases: CaseListItem[];
  escalatingId: string | null;
  onEscalate: (caseId: string) => void;
  onAssign: (caseId: string) => void;
}

export const QueueBoard = ({
  cases,
  escalatingId,
  onEscalate,
  onAssign,
}: QueueBoardProps): ReactNode => {
  const lanes = buildLanes(cases);

  return (
    <Stack gap="xl">
      {lanes.map((lane) => (
        <Card
          key={lane.key}
          withBorder
          p="lg"
          radius="lg"
          bg="var(--hermes-surface)"
        >
          <Stack gap="md">
            <Group justify="space-between" align="baseline">
              <Group gap="xs">
                <Text fw={700}>{lane.title}</Text>
                <Pill tone={lane.tone}>{lane.items.length}</Pill>
              </Group>
              <Text size="xs" c="dimmed">
                {lane.hint}
              </Text>
            </Group>
            {lane.items.length === 0 ? (
              <Text size="sm" c="dimmed" py="sm">
                Nothing here right now.
              </Text>
            ) : (
              <Stack gap="sm">
                {lane.items.map((item) => (
                  <QueueRow
                    key={item.id}
                    item={item}
                    escalating={escalatingId === item.id}
                    onEscalate={onEscalate}
                    onAssign={onAssign}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
};
