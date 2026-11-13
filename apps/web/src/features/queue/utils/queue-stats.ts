interface QueueCaseRef {
  acknowledgedAt: string | null;
  status: string;
  slaDueAt: string;
  assignedToId: string | null;
}

interface QueueStats {
  pending: number;
  breached: number;
  unassigned: number;
}

export const queueStats = (cases: QueueCaseRef[]): QueueStats => ({
  pending: cases.filter(
    (item) =>
      item.acknowledgedAt === null &&
      (item.status === "notified" || item.status === "escalated"),
  ).length,
  breached: cases.filter(
    (item) =>
      new Date(item.slaDueAt).getTime() < Date.now() &&
      item.acknowledgedAt === null &&
      item.status !== "closed",
  ).length,
  unassigned: cases.filter((item) => item.assignedToId === null).length,
});
