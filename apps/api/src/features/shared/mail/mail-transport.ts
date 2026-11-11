import dns from "node:dns";
import { env } from "@api/features/shared/env/index";
import { ServiceUnavailableError } from "@api/features/shared/errors/index";
import nodemailer from "nodemailer";

// Docker bridge routes occasionally resolve IPv6 first and add seconds to a
// send that has an 8s timeout; mail has no reason to prefer it.
dns.setDefaultResultOrder("ipv4first");

export const isMailConfigured = (): boolean => env.SMTP_HOST !== "";

export const createMailTransport = () => {
  if (!isMailConfigured()) {
    throw new ServiceUnavailableError("Email is not configured.");
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER === ""
      ? {}
      : { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }),
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });
};

/** Used by the delivery diagnostics view; never blocks a request path. */
export const verifyMail = async (): Promise<boolean> => {
  if (!isMailConfigured()) return false;
  const transport = createMailTransport();
  try {
    await transport.verify();
    return true;
  } finally {
    transport.close();
  }
};
