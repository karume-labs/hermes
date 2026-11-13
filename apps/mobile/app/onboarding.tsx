import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { type FlatList, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingControls } from "@/components/onboarding/onboarding-controls";
import { OnboardingSlideList } from "@/components/onboarding/onboarding-slide-list";
import { Text } from "@/components/ui/text";
import {
  hasNotificationPermission,
  registerPushToken,
  requestNotificationPermission,
} from "@/lib/notifications";
import { markOnboardingDone } from "@/lib/onboarding";
import {
  ONBOARDING_SLIDES,
  type OnboardingSlide,
} from "@/lib/onboarding-slides";

const OnboardingScreen = () => {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const [alertsOn, setAlertsOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const slide = ONBOARDING_SLIDES[index];
  const isLast = index === ONBOARDING_SLIDES.length - 1;
  const needsAlerts = slide.kind === "permission" && !alertsOn;

  useEffect(() => {
    void (async () => {
      setAlertsOn(await hasNotificationPermission().catch(() => false));
    })();
  }, []);

  const finish = async (): Promise<void> => {
    await markOnboardingDone();
    router.replace("/");
  };

  const goTo = (next: number): void => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const turnOnAlerts = async (): Promise<void> => {
    setBusy(true);
    const granted = await requestNotificationPermission().catch(() => false);
    setAlertsOn(granted);
    setBusy(false);
    if (granted) {
      // Registers the device token so the next result actually reaches the
      // phone; the permission prompt alone does not subscribe anything.
      void registerPushToken();
    }
  };

  const onNext = (): void => {
    if (needsAlerts) {
      void turnOnAlerts();
      return;
    }
    if (isLast) {
      void finish();
      return;
    }
    goTo(index + 1);
  };

  const onSkip = (): void => {
    if (slide.kind === "permission" && !isLast) {
      goTo(index + 1);
      return;
    }
    void finish();
  };

  const ctaLabel = needsAlerts
    ? busy
      ? "Waiting for your phone…"
      : "Turn on result alerts"
    : isLast
      ? "Go to my care loop"
      : "Next";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="h-12 flex-row items-center justify-between px-6">
        <Text className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Hermes Care
        </Text>
        <Text className="text-[12px] font-medium text-muted-foreground">
          {index + 1} of {ONBOARDING_SLIDES.length}
        </Text>
      </View>

      <OnboardingSlideList
        pageWidth={width}
        busy={busy}
        alertsOn={alertsOn}
        listRef={listRef}
        onIndexChange={setIndex}
      />

      <OnboardingControls
        slideIds={ONBOARDING_SLIDES.map((entry) => entry.id)}
        activeIndex={index}
        ctaLabel={ctaLabel}
        busy={busy}
        skipLabel={
          isLast ? undefined : slide.kind === "permission" ? "Not now" : "Skip"
        }
        onNext={onNext}
        onSkip={onSkip}
      />
    </SafeAreaView>
  );
};

export default OnboardingScreen;
