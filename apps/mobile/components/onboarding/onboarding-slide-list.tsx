import type { RefObject } from "react";
import {
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { OnboardingSlideView } from "@/components/onboarding/onboarding-slide";
import { Text } from "@/components/ui/text";
import {
  ONBOARDING_SLIDES,
  type OnboardingSlide,
} from "@/lib/onboarding-slides";

interface OnboardingSlideListProps {
  pageWidth: number;
  busy: boolean;
  alertsOn: boolean;
  listRef: RefObject<FlatList<OnboardingSlide> | null>;
  onIndexChange: (index: number) => void;
}

export const OnboardingSlideList = ({
  pageWidth,
  busy,
  alertsOn,
  listRef,
  onIndexChange,
}: OnboardingSlideListProps) => {
  const renderSlide: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <OnboardingSlideView slide={item} pageWidth={pageWidth}>
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

  const onMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    onIndexChange(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
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
        length: pageWidth,
        offset: pageWidth * i,
        index: i,
      })}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={3}
      className="flex-1"
    />
  );
};
