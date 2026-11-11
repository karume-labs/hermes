import type { NotificationRow } from "@api/features/notify/services/notification-dto";
import { sendExpoPush } from "@api/features/notify/services/notification-push";
import {
  notificationText,
  type PatientContact,
  pushTokensFor,
} from "@api/features/notify/services/notification-recipients";
import { env } from "@api/features/shared/env/index";
import {
  sendPatientAlertEmail,
  wantsEmail,
} from "@api/features/shared/mail/index";

// A missing consent or device cannot be fixed by retrying.
export class PermanentDeliveryError extends Error {}

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
  }
};
