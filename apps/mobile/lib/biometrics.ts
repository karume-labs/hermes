import * as LocalAuthentication from "expo-local-authentication";

export const isBiometricAvailable = async (): Promise<boolean> => {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
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
