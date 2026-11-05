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
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { "content-type": "application/json", ...options?.headers },
      cache: "no-store",
    });
    if (!response.ok) {
      logRequest(method, response.status);
      return {
        ...response,
        json: async () => ({
          success: false,
          code: `HTTP_${response.status}`,
          message:
            response.status === 401
              ? "Your session expired. Sign in again."
              : `Request failed with status ${response.status}`,
        }),
      } as Response;
    }
    logRequest(method, response.status);
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

export const api = treaty<App>(env.NEXT_PUBLIC_API_URL, { fetcher });
