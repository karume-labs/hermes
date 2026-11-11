import { env } from "@api/features/shared/env/index";
import { buildEmailHtml } from "@api/features/shared/mail/email-template";
import { sendMail } from "@api/features/shared/mail/send-mail";
import type { NotificationPreference } from "@hermes/types";

export {
  buildEmailHtml,
  escapeHtml,
} from "@api/features/shared/mail/email-template";
export {
  createMailTransport,
  isMailConfigured,
  verifyMail,
} from "@api/features/shared/mail/mail-transport";
export {
  type MailKind,
  type MailResult,
  sendMail,
  wantsEmail,
} from "@api/features/shared/mail/send-mail";

const appUrl = (path: string): string =>
  `${env.FRONTEND_URL.replace(/\/$/, "")}${path}`;

export const sendStaffInviteEmail = (input: {
  to: string;
  name: string;
  role: string;
  organizationName: string;
  inviteUrl: string;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    subject: `${input.organizationName} invited you to Hermes Care`,
    kind: "staff_invite",
    html: buildEmailHtml({
      heading: `Join ${input.organizationName} on Hermes Care`,
      paragraphs: [
        `Hello ${input.name},`,
        `${input.organizationName} added you to their care team as ${input.role.replaceAll("_", " ")}. Set a password to open the dashboard.`,
        "This link works once and expires in seven days.",
      ],
      actionLabel: "Set your password",
      actionUrl: input.inviteUrl,
      footerNote:
        "If you were not expecting this, ignore the message and tell your organization's administrator.",
    }),
  });

export const sendPasswordResetEmail = (input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    subject: "Reset your Hermes Care password",
    kind: "password_reset",
    html: buildEmailHtml({
      heading: "Reset your password",
      paragraphs: [
        `Hello ${input.name},`,
        "Use the button below to choose a new password. The link expires in one hour.",
      ],
      actionLabel: "Choose a new password",
      actionUrl: input.resetUrl,
      footerNote:
        "If you did not ask for this, no change was made and you can ignore this message.",
    }),
  });

export const sendPatientCodeEmail = (input: {
  to: string;
  name: string;
  code: string;
  minutes: number;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    subject: `Your Hermes Care code is ${input.code}`,
    kind: "patient_code",
    html: buildEmailHtml({
      heading: "Your sign-in code",
      paragraphs: [
        `Hello ${input.name},`,
        `Enter this code to open Hermes Care: ${input.code}`,
        `It expires in ${input.minutes} minutes.`,
      ],
      footerNote: "Hermes Care will never ask you for this code.",
    }),
  });

export const sendPatientResultEmail = (input: {
  to: string;
  name: string;
  clinicName: string;
  summary: string;
  preference: NotificationPreference;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    preference: input.preference,
    subject: "A new result is ready in Hermes Care",
    kind: "patient_result",
    html: buildEmailHtml({
      heading: "Your result is ready",
      paragraphs: [
        `Hello ${input.name},`,
        input.summary,
        `${input.clinicName} has shared the full result and next steps in the app.`,
      ],
      actionLabel: "Open Hermes Care",
      actionUrl: appUrl("/"),
      footerNote:
        "You can change how you receive updates in Profile → Notifications.",
    }),
  });

export const sendVisitReminderEmail = (input: {
  to: string;
  name: string;
  when: string;
  clinicName: string;
  preference: NotificationPreference;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    preference: input.preference,
    subject: `Visit reminder: ${input.when}`,
    kind: "visit_reminder",
    html: buildEmailHtml({
      heading: "Your visit is coming up",
      paragraphs: [
        `Hello ${input.name},`,
        `${input.clinicName} expects you on ${input.when}.`,
        "Bring any prior results and arrive 15 minutes early. You can reschedule from the app if you cannot make it.",
      ],
      actionLabel: "View your visit",
      actionUrl: appUrl("/visits"),
      footerNote:
        "You can change how you receive updates in Profile → Notifications.",
    }),
  });

// One generic alert for a queued patient notification. The in-app copy stays
// the canonical wording, so email and app never disagree.
export const sendPatientAlertEmail = (input: {
  to: string;
  name: string;
  text: string;
  heading: string;
  preference: NotificationPreference;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    preference: input.preference,
    subject: input.heading,
    kind: "patient_result",
    html: buildEmailHtml({
      heading: input.heading,
      paragraphs: [`Hello ${input.name},`, input.text],
      actionLabel: "Open Hermes Care",
      actionUrl: appUrl("/"),
      footerNote:
        "You can change how you receive updates in Profile → Notifications.",
    }),
  });

export const sendStaffAlertEmail = (input: {
  to: string;
  name: string;
  subject: string;
  paragraphs: string[];
  actionLabel: string;
  path: string;
  preference: NotificationPreference;
}): Promise<unknown> =>
  sendMail({
    to: input.to,
    preference: input.preference,
    subject: input.subject,
    kind: "staff_alert",
    html: buildEmailHtml({
      heading: input.subject,
      paragraphs: [`Hello ${input.name},`, ...input.paragraphs],
      actionLabel: input.actionLabel,
      actionUrl: appUrl(input.path),
      footerNote:
        "You can switch staff alerts to in-app only in the dashboard account menu.",
    }),
  });
