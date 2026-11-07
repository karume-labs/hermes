import { useRouter } from "expo-router";
import * as React from "react";
import { Platform } from "react-native";
import {
  type PatientProfile,
  requestPatientCode,
  updateConsent,
  verifyPatientCode,
} from "@/lib/auth";
import { careApi } from "@/lib/care-api";
import { registerPushToken } from "@/lib/notifications";

type Step = "phone" | "code";

export const usePatientSignIn = () => {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const sendCode = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const result = await requestPatientCode(phone.trim());
      setDevCode(result.devCode === undefined ? null : result.devCode);
      setStep("code");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not send a code.",
      );
    } finally {
      setBusy(false);
    }
  };

  const finish = async (patient: PatientProfile): Promise<void> => {
    const token = await registerPushToken().catch(() => null);
    if (token !== null) {
      await careApi
        .registerDevice(patient.id, token, Platform.OS)
        .catch(() => undefined);
    }
    router.replace("/");
  };

  const verify = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const patient = await verifyPatientCode(phone.trim(), code.trim());
      // The checkbox is required before a code is sent, so this records the
      // patient's explicit choice rather than relying on seeded defaults.
      await updateConsent(true, true);
      await finish(patient);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "That code did not work.",
      );
      setBusy(false);
    }
  };

  const chooseAnotherNumber = (): void => {
    setStep("phone");
    setCode("");
    setError("");
  };

  return {
    step,
    phone,
    setPhone,
    code,
    setCode,
    consent,
    toggleConsent: () => setConsent((value) => !value),
    devCode,
    error,
    busy,
    sendCode,
    verify,
    chooseAnotherNumber,
    canSend: phone.trim().length >= 8 && consent && !busy,
    canVerify: code.trim().length === 6 && !busy,
  };
};
