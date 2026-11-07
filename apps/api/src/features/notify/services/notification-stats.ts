import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { notifications } from "@db/notify/schema/index";
import { eq } from "drizzle-orm";

export interface DeliveryStats {
  queued: number;
  sent: number;
  failed: number;
  read: number;
  smsQueued: number;
}

const clinicScope = (clinicId: string | null) =>
  clinicId === null ? undefined : eq(careCases.clinicId, clinicId);

export const notificationStats = async (
  clinicId: string | null = null,
): Promise<DeliveryStats> => {
  const rows = await db
    .select({ notification: notifications })
    .from(notifications)
    .innerJoin(careCases, eq(notifications.caseId, careCases.id))
    .where(clinicScope(clinicId))
    .then((result) => result.map((row) => row.notification));
  return {
    queued: rows.filter((row) => row.status === "queued").length,
    sent: rows.filter((row) => row.status === "sent").length,
    failed: rows.filter((row) => row.status === "failed").length,
    read: rows.filter((row) => row.status === "read").length,
    smsQueued: rows.filter(
      (row) => row.kind === "sms_fallback" && row.status !== "failed",
    ).length,
  };
};

export const notificationRows = async () => db.select().from(notifications);
