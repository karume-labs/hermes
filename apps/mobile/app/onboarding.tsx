import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingControls } from "@/components/onboarding/onboarding-controls";
import { OnboardingSlideView } from "@/components/onboarding/onboarding-slide";
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

  const onMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const renderSlide: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <OnboardingSlideView slide={item} pageWidth={width}>
      {item.kind === "permission" ? (
        <Text className="text-[14px] font-medium text-primary">
          {busy
            ? "Asking your phone…"
            : alertsOn
              ? "Alerts are on for this phone."
              : "You can change this later in Profile."}
        </Text>
      ) : null}
    </OnboardingSlideView>
  );

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

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        className="flex-1"
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
