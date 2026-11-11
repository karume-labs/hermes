import type { NotificationPreference } from "@hermes/types";
import { useRouter } from "expo-router";
import * as React from "react";
import { Platform } from "react-native";
import { useRecordEvent, useRegisterDevice } from "@/lib/api/queries";
import {
  type PatientProfile,
  registerPatient,
  requestPatientCode,
  verifyPatientCode,
} from "@/lib/auth";
import { registerPushToken } from "@/lib/notifications";

type Step = "phone" | "code" | "signup";

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const usePatientSignIn = () => {
  const router = useRouter();
  const device = useRegisterDevice();
  const recordEvent = useRecordEvent();
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [channel, setChannel] =
    React.useState<NotificationPreference>("in_app");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const finish = async (patient: PatientProfile): Promise<void> => {
    const token = await registerPushToken().catch(() => null);
    if (token !== null) {
      device.mutate({ token, platform: Platform.OS });
    }
    recordEvent.mutate({ type: "app_open" });
    void patient;
    router.replace("/");
  };

  const sendCode = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const result = await requestPatientCode(phone.trim());
      setDevCode(result.devCode === undefined ? null : result.devCode);
      setStep("code");
    } catch (caught) {
      setError(messageOf(caught, "Could not send a code."));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const patient = await verifyPatientCode(phone.trim(), code.trim());
      await finish(patient);
    } catch (caught) {
      setError(messageOf(caught, "That code did not work."));
      setBusy(false);
    }
  };

  // Public sign-up: the account exists before any clinic knows the patient.
  const signUp = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const patient = await registerPatient({
        name: name.trim(),
        phone: phone.trim(),
        ...(email.trim() === "" ? {} : { email: email.trim() }),
        emailConsent: consent && channel !== "in_app",
        notificationChannel: channel,
      });
      await finish(patient);
    } catch (caught) {
      setError(messageOf(caught, "Could not create your account."));
      setBusy(false);
    }
  };

  const toggleConsent = (): void => setConsent((value) => !value);

  return {
    step,
    phone,
    setPhone,
    name,
    setName,
    email,
    setEmail,
    code,
    setCode,
    consent,
    toggleConsent,
    channel,
    setChannel,
    devCode,
    error,
    busy,
    sendCode,
    verify,
    signUp,
    startSignUp: () => {
      setError("");
      setStep("signup");
    },
    chooseAnotherNumber: () => {
      setStep("phone");
      setCode("");
      setError("");
    },
    canSend: phone.trim().length >= 8 && consent && !busy,
    canVerify: code.trim().length === 6 && !busy,
    canSignUp:
      name.trim().length >= 2 && phone.trim().length >= 8 && consent && !busy,
  };
};
