import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { env } from "@api/features/shared/env/index";

export const normalizePhone = (input: string): string =>
  input.replace(/[\s()-]/g, "");

export const generateCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, "0");

export const generateSessionToken = (): string =>
  randomBytes(32).toString("base64url");

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

// HMAC with the server secret so a leaked database dump cannot be brute-forced
// offline into a 6-digit code.
export const hashCode = (patientId: string, code: string): string =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${patientId}:${code}`)
    .digest("hex");

export const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};
