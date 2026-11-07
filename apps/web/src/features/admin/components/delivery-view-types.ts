export interface NotificationRow {
  id: string;
  caseId: string;
  channel: string;
  kind: string;
  status: string;
  attempts: number;
  error: string | null;
  createdAt: string;
}
