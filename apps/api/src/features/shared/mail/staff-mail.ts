import { appUrl } from "@api/features/shared/mail/app-url";
import { buildEmailHtml } from "@api/features/shared/mail/email-template";
import { sendMail } from "@api/features/shared/mail/send-mail";
import type { NotificationPreference } from "@hermes/types";

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
