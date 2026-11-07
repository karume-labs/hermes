import * as SecureStore from "expo-secure-store";

const ONBOARDING_DONE_KEY = "hermes-onboarding-done";

/** True once the patient has finished or skipped the intro slides. */
export const isOnboardingDone = async (): Promise<boolean> =>
  (await SecureStore.getItemAsync(ONBOARDING_DONE_KEY)) === "true";

export const markOnboardingDone = async (): Promise<void> => {
  await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, "true");
};
