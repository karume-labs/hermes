"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/features/auth/services/client";
import type { Session } from "@/features/auth/services/types";

/**
 * The shared session store can settle without telling React, which leaves the
 * shell on its skeleton with no request to retry, so the shell reads the
 * session itself: one request per page load and a `ready` flag it can trust.
 */
export const useShellSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const read = async () => {
      const result = await authClient.getSession().catch(() => null);
      if (cancelled) return;
      setSession(result?.data === undefined ? null : result.data);
      setReady(true);
    };
    void read();
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, ready };
};
