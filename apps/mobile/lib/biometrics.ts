import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const UNLOCK_KEY = "hermes-biometric-unlock";

export const isBiometricAvailable = async (): Promise<boolean> => {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
};

/**
 * Off until the patient turns it on in Profile: an app that demands a
 * fingerprint on first launch reads as a barrier, not as privacy.
 */
export const isBiometricUnlockEnabled = async (): Promise<boolean> =>
  (await SecureStore.getItemAsync(UNLOCK_KEY)) === "true";

export const setBiometricUnlockEnabled = async (
  enabled: boolean,
): Promise<void> => {
  if (enabled) {
    await SecureStore.setItemAsync(UNLOCK_KEY, "true");
    return;
  }
  await SecureStore.deleteItemAsync(UNLOCK_KEY);
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  const available = await isBiometricAvailable();
  if (!available) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirm your screening update",
    fallbackLabel: "Use passcode",
  });
  return result.success;
};
