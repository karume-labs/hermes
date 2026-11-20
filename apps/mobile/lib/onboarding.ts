import { readKey, writeKey } from "@/lib/key-store";

const ONBOARDING_DONE_KEY = "hermes-onboarding-done";

/** True once the patient has finished or skipped the intro slides. */
export const isOnboardingDone = async (): Promise<boolean> =>
  (await readKey(ONBOARDING_DONE_KEY)) === "true";

export const markOnboardingDone = async (): Promise<void> => {
  await writeKey(ONBOARDING_DONE_KEY, "true");
};
