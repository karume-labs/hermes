import { env } from "@api/features/shared/env/index";
import { ServiceUnavailableError } from "@api/features/shared/errors/index";
import {
  createMailTransport,
  isMailConfigured,
} from "@api/features/shared/mail/mail-transport";
import { db } from "@db/client";
import { emailLogs } from "@db/email/schema/index";
import type { EmailStatus, NotificationPreference } from "@hermes/types";

/** Which messages may be suppressed by a person's notification preference. */
export type MailKind =
  | "staff_invite"
  | "password_reset"
  | "patient_code"
  | "patient_result"
  | "visit_reminder"
  | "staff_alert";

// Sign-in and account-security mail always goes out: suppressing a reset link
// or a login code would lock the person out rather than respect a preference.
const ALWAYS_SEND: MailKind[] = [
  "staff_invite",
  "password_reset",
  "patient_code",
];

export const wantsEmail = (channel: NotificationPreference): boolean =>
  channel === "email" || channel === "both";

const record = async (input: {
  recipient: string;
  subject: string;
  kind: MailKind;
  status: EmailStatus;
  error?: string;
  skipReason?: string;
}): Promise<void> => {
  try {
    await db.insert(emailLogs).values(input);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "email_log_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
};

export type MailResult = "sent" | "skipped";

export interface SendMailInput {
  to: string | null;
  subject: string;
  html: string;
  kind: MailKind;
  /** Omitted for account-security mail, which ignores the preference. */
  preference?: NotificationPreference;
}

/**
 * The only send path. Preference checks and the email log live here so a new
 * caller cannot quietly bypass either, and an unconfigured mailer never
 * reports a send it did not perform.
 */
export const sendMail = async (input: SendMailInput): Promise<MailResult> => {
  const to = input.to?.trim().toLowerCase() ?? "";
  if (to === "") {
    await record({
      recipient: "(none)",
      subject: input.subject,
      kind: input.kind,
      status: "skipped",
      skipReason: "Recipient has no email address.",
    });
    return "skipped";
  }

  if (
    input.preference !== undefined &&
    !ALWAYS_SEND.includes(input.kind) &&
    !wantsEmail(input.preference)
  ) {
    await record({
      recipient: to,
      subject: input.subject,
      kind: input.kind,
      status: "skipped",
      skipReason: "Recipient prefers in-app notifications.",
    });
    return "skipped";
  }

  if (!isMailConfigured()) {
    const reason = "SMTP is not configured for this deployment.";
    await record({
      recipient: to,
      subject: input.subject,
      kind: input.kind,
      status: "skipped",
      skipReason: reason,
    });
    // Security mail cannot silently disappear: the caller needs to surface the
    // failure (for example "ask your administrator to send the invite again").
    if (ALWAYS_SEND.includes(input.kind)) {
      throw new ServiceUnavailableError(
        "Email is not available right now. Try again later or contact your administrator.",
      );
    }
    return "skipped";
  }

  const transport = createMailTransport();
  try {
    await transport.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: input.subject,
      html: input.html,
    });
    await record({
      recipient: to,
      subject: input.subject,
      kind: input.kind,
      status: "sent",
    });
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await record({
      recipient: to,
      subject: input.subject,
      kind: input.kind,
      status: "failed",
      error: message,
    });
    if (ALWAYS_SEND.includes(input.kind)) {
      throw new ServiceUnavailableError(
        "Email could not be sent. Try again in a moment.",
      );
    }
    return "skipped";
  } finally {
    transport.close();
  }
};
