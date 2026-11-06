import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";

type RequestTrace = { id: string; startedAt: number };

// Keyed by the Request object so concurrent requests never share a trace.
const traces = new WeakMap<Request, RequestTrace>();

const uuidPattern =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

// Access logs keep the route shape, never the patient or case identifier.
const safePath = (pathname: string): string =>
  pathname
    .replace(/\/patients\/[^/]+/g, "/patients/:id")
    .replace(uuidPattern, ":id");

const log = (level: "info" | "warn" | "error", fields: object): void => {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === "info") console.log(line);
  else if (level === "warn") console.warn(line);
  else console.error(line);
};

/**
 * Request ids + one structured access log line. Query strings are deliberately
 * omitted because patient ids and tokens can appear in them.
 */
export const observabilityPlugin = new Elysia()
  .onRequest(({ request, set }) => {
    const id = request.headers.get("x-request-id") ?? randomUUID();
    traces.set(request, { id, startedAt: performance.now() });
    set.headers["x-request-id"] = id;
  })
  .onAfterResponse({ as: "global" }, ({ request, set }) => {
    const trace = traces.get(request);
    if (trace === undefined) return;
    log("info", {
      msg: "request",
      requestId: trace.id,
      method: request.method,
      path: safePath(new URL(request.url).pathname),
      status: set.status ?? 200,
      durationMs: Math.round(performance.now() - trace.startedAt),
    });
  })
  .onError({ as: "global" }, ({ request, error, code }) => {
    const trace = traces.get(request);
    log("error", {
      msg: "request_failed",
      requestId: trace?.id ?? "unknown",
      method: request.method,
      path: safePath(new URL(request.url).pathname),
      code,
      error: error instanceof Error ? error.message : String(error),
    });
  });
