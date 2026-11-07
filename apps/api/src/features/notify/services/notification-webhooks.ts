import { db } from "@db/client";
import { webhookLogs } from "@db/notify/schema/index";
import { desc } from "drizzle-orm";

export const recordWebhook = async (
  source: string,
  ok: boolean,
  status: string,
  detail: unknown,
): Promise<void> => {
  await db.insert(webhookLogs).values({ source, ok, status, detail });
};

export const listWebhookLogs = async (limit = 50) => {
  const rows = await db
    .select()
    .from(webhookLogs)
    .orderBy(desc(webhookLogs.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    ok: row.ok,
    status: row.status,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
};
