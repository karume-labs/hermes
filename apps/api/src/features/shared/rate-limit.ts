import { env } from "@api/features/shared/env/index";
import { TooManyRequestsError } from "@api/features/shared/errors/index";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

const prune = (now: number): void => {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

/**
 * Fixed-window limiter for the few endpoints Better Auth does not cover
 * (patient codes, invite acceptance). Per-process: behind multiple API
 * instances the edge proxy limit is the durable control.
 */
export const enforceRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): void => {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (bucket === undefined || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    // Round up so the caller never reads "try again in 0 seconds".
    const secondsLeft = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new TooManyRequestsError(secondsLeft);
  }
};

/** The slice of Elysia's `server` this module needs. */
type IpServer = {
  requestIP: (request: Request) => { address: string } | null;
};

/**
 * `x-forwarded-for` is client-controlled unless a proxy rewrites it, so it is
 * only trusted when TRUST_PROXY is on (the compose stack sits behind Caddy).
 * Otherwise the socket address is used, so a caller cannot rotate a header to
 * reset every rate limit.
 */
export const clientAddress = (
  headers: Headers,
  server: IpServer | null,
  request: Request,
): string => {
  if (env.TRUST_PROXY) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded !== null) {
      const first = forwarded.split(",")[0]?.trim();
      if (first !== undefined && first !== "") return first;
    }
  }
  const socket = server === null ? null : server.requestIP(request);
  return socket === null ? "unknown" : socket.address;
};
