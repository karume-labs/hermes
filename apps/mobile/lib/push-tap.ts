import * as Notifications from "expo-notifications";
import type { useRouter } from "expo-router";
import { getPatientId, trackEvent } from "@/lib/session";

const caseIdOf = (data: unknown): string | undefined => {
  if (data === undefined || data === null) return undefined;
  if (typeof data !== "object") return undefined;
  if (!("caseId" in data)) return undefined;
  return typeof data.caseId === "string" ? data.caseId : undefined;
};

/**
 * Opening a result notification should land on that result and count as a
 * push open. Returns the subscription so the caller can clean it up.
 */
export const addNotificationTapListener = (
  router: ReturnType<typeof useRouter>,
): { remove: () => void } =>
  Notifications.addNotificationResponseReceivedListener((response) => {
    const caseId = caseIdOf(response.notification.request.content.data);
    if (caseId === undefined) return;
    void (async () => {
      const id = await getPatientId();
      trackEvent(id, "push_opened", caseId);
    })();
    router.push({
      pathname: "/care-action",
      params: { caseId },
    });
  });
