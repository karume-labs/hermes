import type { NotificationRow } from "@api/features/notify/services/notification-dto";
import { sendExpoPush } from "@api/features/notify/services/notification-push";
import { env } from "@api/features/shared/env/index";
import {
  sendPatientAlertEmail,
  wantsEmail,
} from "@api/features/shared/mail/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { deviceTokens } from "@db/patient/schema/index";
import type { NotificationPreference } from "@hermes/types";
import { eq, inArray } from "drizzle-orm";

// A missing consent or device cannot be fixed by retrying.
export class PermanentDeliveryError extends Error {}

export interface PatientContact {
  name: string;
  phone: string;
  email: string | null;
  clinicName: string | null;
  pushConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  notificationChannel: NotificationPreference;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const pushTokensFor = async (patientId: string): Promise<string[]> => {
  const rows = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(eq(deviceTokens.patientId, patientId));
  return rows.map((row) => row.token);
};

export const contactsFor = async (
  patientIds: string[],
): Promise<Map<string, PatientContact>> => {
  if (patientIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      email: patients.email,
      clinicName: clinics.name,
      pushConsent: patients.pushConsent,
      smsConsent: patients.smsConsent,
      emailConsent: patients.emailConsent,
      notificationChannel: patients.notificationChannel,
    })
    .from(patients)
    .leftJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(inArray(patients.id, patientIds));
  return new Map(
    rows.map((row) => [
      row.id,
      {
        name: row.name,
        phone: row.phone,
        email: row.email,
        clinicName: row.clinicName,
        pushConsent: row.pushConsent,
        smsConsent: row.smsConsent,
        emailConsent: row.emailConsent,
        notificationChannel: row.notificationChannel,
      },
    ]),
  );
};

export const notificationText = (row: NotificationRow): string => {
  if (isRecord(row.payload)) {
    if (typeof row.payload.text === "string") return row.payload.text;
    if (typeof row.payload.summary === "string") return row.payload.summary;
  }
  switch (row.kind) {
    case "visit_reminder":
      return "Your visit is tomorrow. Bring prior labs and arrive 15 minutes early.";
    case "escalation":
      return "Your result still needs follow-up. Open Hermes Care or call your clinic.";
    case "secure_message":
      return "Your care team sent you a secure message.";
    default:
      return "A new result is ready in Hermes Care.";
  }
};

const postSink = async (
  notification: NotificationRow,
  tokens: string[],
  contact: PatientContact | undefined,
): Promise<void> => {
  if (env.NOTIFY_WEBHOOK_URL === "") {
    throw new PermanentDeliveryError(
      "No notification provider is configured for this channel.",
    );
  }
  const response = await fetch(env.NOTIFY_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseId: notification.caseId,
      patientId: notification.patientId,
      to: contact?.phone,
      text: notificationText(notification),
      channel: notification.channel,
      kind: notification.kind,
      payload: notification.payload,
      deviceTokens: tokens,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`sink responded ${response.status}`);
};

const emailFor = async (
  notification: NotificationRow,
  contact: PatientContact,
): Promise<void> => {
  if (contact.email === null || !contact.emailConsent) {
    throw new PermanentDeliveryError("Patient has no consented email address.");
  }
  await sendPatientAlertEmail({
    to: contact.email,
    name: contact.name,
    text: notificationText(notification),
    heading:
      notification.kind === "visit_reminder"
        ? "Your visit is coming up"
        : "Your result is ready",
    preference: contact.notificationChannel,
  });
};

/** Chooses the transport for one notification and throws on permanent failure. */
export const deliver = async (
  notification: NotificationRow,
  contact: PatientContact | undefined,
): Promise<void> => {
  if (contact === undefined) {
    throw new PermanentDeliveryError("Patient is not in the directory.");
  }

  // In-app is the copy the app always shows. When the patient also asked for
  // email, the same text goes out by mail; a mail failure must not fail the
  // in-app delivery, so it is attempted best-effort here.
  if (notification.channel === "in_app") {
    if (
      contact.email !== null &&
      contact.emailConsent &&
      wantsEmail(contact.notificationChannel)
    ) {
      await emailFor(notification, contact).catch(() => undefined);
    }
    return;
  }

  if (notification.channel === "email") {
    await emailFor(notification, contact);
    return;
  }

  if (notification.channel === "push") {
    if (!contact.pushConsent) {
      throw new PermanentDeliveryError("Patient has not consented to push.");
    }
    const tokens = await pushTokensFor(notification.patientId);
    if (tokens.length > 0) {
      await sendExpoPush(notification, tokens);
      return;
    }
    await postSink(notification, tokens, contact);
    return;
  }

  if (notification.channel === "sms") {
    if (!contact.smsConsent) {
      throw new PermanentDeliveryError("Patient has not consented to SMS.");
    }
    await postSink(notification, [], contact);
    return;
  }
};
