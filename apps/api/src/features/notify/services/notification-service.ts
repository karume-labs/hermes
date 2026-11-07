import {
  type QueuedNotification,
  type QueueNotificationInput,
  toNotification,
} from "@api/features/notify/services/notification-dto";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { notifications } from "@db/notify/schema/index";
import { and, desc, eq, or } from "drizzle-orm";

export const queueNotification = async (
  input: QueueNotificationInput,
): Promise<void> => {
  await db.insert(notifications).values({ ...input, status: "queued" });
};

export const listNotifications = async (
  caseId: string,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.caseId, caseId))
    .orderBy(desc(notifications.createdAt));
  return rows.map(toNotification);
};

export const listPatientNotifications = async (
  patientId: string,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.patientId, patientId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return rows.map(toNotification);
};

export const listRecentNotifications = async (
  limit = 50,
  clinicId: string | null = null,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select({ notification: notifications })
    .from(notifications)
    .innerJoin(careCases, eq(notifications.caseId, careCases.id))
    .where(clinicId === null ? undefined : eq(careCases.clinicId, clinicId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map((row) => toNotification(row.notification));
};

export const markNotificationRead = async (id: string): Promise<boolean> => {
  const [row] = await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(eq(notifications.id, id))
    .returning();
  return row !== undefined;
};

// Ownership is checked in the WHERE clause so a guessed id cannot mark a
// different patient's alert as read.
export const markNotificationReadForPatient = async (
  id: string,
  patientId: string,
): Promise<boolean> => {
  const [row] = await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(eq(notifications.id, id), eq(notifications.patientId, patientId)),
    )
    .returning();
  return row !== undefined;
};

// Acknowledging a case is a read receipt for every alert it produced.
export const markCaseNotificationsRead = async (
  caseId: string,
): Promise<void> => {
  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(
        eq(notifications.caseId, caseId),
        or(
          eq(notifications.status, "sent"),
          eq(notifications.status, "delivered"),
          eq(notifications.status, "queued"),
        ),
      ),
    );
};
