import type { App } from "@api/index";
import { treaty } from "@elysiajs/eden";
import { env } from "@/features/shared/env/index";

const isDev = env.NODE_ENV !== "production";

const logRequest = (method: string, status: number, error?: string): void => {
  if (status >= 400) {
    console.warn(
      `[${method}] ${status}${error === undefined ? "" : ` - ${error}`}`,
    );
    return;
  }
  if (isDev) console.log(`[${method}] ${status}`);
};

const fetcher = Object.assign(
  async (
    url: string | URL | Request,
    options?: RequestInit,
  ): Promise<Response> => {
    const method = (options?.method ?? "GET").toUpperCase();
    // FormData sets its own multipart boundary; forcing JSON here would break
    // document uploads before they reach the API.
    const isFormData = options?.body instanceof FormData;
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: isFormData
        ? { ...options?.headers }
        : { "content-type": "application/json", ...options?.headers },
      cache: "no-store",
    });
    logRequest(method, response.status);
    // Errors flow back through Eden as `{ status, value }`; rewriting the
    // Response here would lose the API's message and status.
    return response;
  },
  // Bun's fetch type carries a preconnect hook; Eden expects `typeof fetch`.
  {
    preconnect: (
      _url: string | URL,
      _options?: {
        dns?: boolean;
        tcp?: boolean;
        http?: boolean;
        https?: boolean;
      },
    ): void => undefined,
  },
);

// Contracts carry ISO strings; Eden's implicit Date conversion makes free text
// that looks like a date (for example a treatment date) render as an object.
export const api = treaty<App>(env.NEXT_PUBLIC_API_URL, {
  fetcher,
  parseDate: false,
});
