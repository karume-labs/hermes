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
    throw new TooManyRequestsError();
  }
};

export const clientAddress = (headers: Headers): string => {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded !== null) {
    const first = forwarded.split(",")[0]?.trim();
    if (first !== undefined && first !== "") return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
};
