import { ActivityIndicator, ScrollView } from "react-native";
import { SignInCodeStep } from "@/components/auth/sign-in-code-step";
import { SignInError, SignInHeader } from "@/components/auth/sign-in-header";
import { SignInPhoneStep } from "@/components/auth/sign-in-phone-step";
import { SignInSignUpStep } from "@/components/auth/sign-in-signup-step";
import { Text } from "@/components/ui/text";
import { usePatientSignIn } from "@/lib/use-patient-sign-in";

const SignInScreen = () => {
  const {
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
    startSignUp,
    chooseAnotherNumber,
    canSend,
    canVerify,
    canSignUp,
  } = usePatientSignIn();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-6 pt-16"
      keyboardShouldPersistTaps="handled"
    >
      <SignInHeader />
      <SignInError error={error} />

      {step === "phone" ? (
        <SignInPhoneStep
          phone={phone}
          setPhone={setPhone}
          consent={consent}
          toggleConsent={toggleConsent}
          busy={busy}
          canSend={canSend}
          sendCode={sendCode}
          startSignUp={startSignUp}
        />
      ) : step === "signup" ? (
        <SignInSignUpStep
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          channel={channel}
          setChannel={setChannel}
          consent={consent}
          toggleConsent={toggleConsent}
          busy={busy}
          canSignUp={canSignUp}
          signUp={signUp}
          chooseAnotherNumber={chooseAnotherNumber}
        />
      ) : (
        <SignInCodeStep
          code={code}
          setCode={setCode}
          devCode={devCode}
          busy={busy}
          canVerify={canVerify}
          verify={verify}
          chooseAnotherNumber={chooseAnotherNumber}
        />
      )}

      {busy ? <ActivityIndicator /> : null}
      <Text className="text-center text-xs text-muted-foreground">
        Codes expire after 10 minutes. When your clinic sends your first result,
        it appears here automatically.
      </Text>
    </ScrollView>
  );
};

export default SignInScreen;
