import type { App } from "@api/index";
import { treaty } from "@elysiajs/eden";
import { env } from "@/lib/env/index";
import { expirePatientSession, getPatientToken } from "@/lib/token-store";

/**
 * Every care request goes through this fetcher so the bearer token, the JSON
 * content type and the expired-session handling exist exactly once. Eden adds
 * the route, body and response types on top of it.
 */
const fetcher = async (
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> => {
  const token = await getPatientToken();
  const headers = new Headers(init?.headers);
  // FormData sets its own multipart boundary.
  const isFormData = init?.body instanceof FormData;
  if (!isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (token !== null) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  // A revoked or expired token must not be shown as a per-screen error: the
  // shared expiry handler sends the app back to sign-in.
  if (response.status === 401) await expirePatientSession();
  return response;
};

// React Native's fetch has no preconnect hook, but Eden's option type matches
// Bun's fetch, so the shape is provided explicitly.
const edenFetcher = Object.assign(fetcher, {
  preconnect: (): void => undefined,
});

export const api = treaty<App>(env.apiBase, {
  fetcher: edenFetcher,
  parseDate: false,
});

const messageFrom = (error: unknown): string => {
  if (error !== null && typeof error === "object") {
    if ("value" in error) return messageFrom(error.value);
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "Something went wrong. Try again.";
};

/** Turns Eden's `{ data, error }` envelope into a value or a readable error. */
export const unwrap = <T>(response: { data: T | null; error: unknown }): T => {
  if (response.error !== null && response.error !== undefined) {
    throw new Error(messageFrom(response.error));
  }
  if (response.data === null)
    throw new Error("Something went wrong. Try again.");
  return response.data;
};
