import { appUrl } from "@api/features/shared/mail/app-url";
import { buildEmailHtml } from "@api/features/shared/mail/email-template";
import { sendMail } from "@api/features/shared/mail/send-mail";
import type { NotificationPreference } from "@hermes/types";

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
