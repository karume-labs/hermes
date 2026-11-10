import { View } from "react-native";
import { PaginatorDot } from "@/components/onboarding/paginator-dot";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface Props {
  slideIds: string[];
  activeIndex: number;
  ctaLabel: string;
  busy?: boolean;
  skipLabel?: string;
  onNext: () => void;
  onSkip: () => void;
}

/** Dots, primary action and a quiet way out, pinned to the bottom. */
export const OnboardingControls = ({
  slideIds,
  activeIndex,
  ctaLabel,
  busy = false,
  skipLabel,
  onNext,
  onSkip,
}: Props) => (
  <View className="gap-3 px-6 pb-6">
    <View className="mb-2 flex-row items-center justify-center gap-2">
      {slideIds.map((id, index) => (
        <PaginatorDot key={id} active={index === activeIndex} />
      ))}
    </View>

    <Button size="lg" className="w-full" disabled={busy} onPress={onNext}>
      <Text className="text-base font-bold text-primary-foreground">
        {ctaLabel}
      </Text>
    </Button>

    {skipLabel === undefined ? (
      <View className="h-12" />
    ) : (
      <Button
        variant="ghost"
        className="w-full"
        disabled={busy}
        onPress={onSkip}
      >
        <Text className="text-muted-foreground">{skipLabel}</Text>
      </Button>
    )}
  </View>
);
