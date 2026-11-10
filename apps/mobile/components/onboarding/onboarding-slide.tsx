import type { ReactNode } from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { OnboardingSlide } from "@/lib/onboarding-slides";
import { cn } from "@/lib/utils";

interface Props {
  slide: OnboardingSlide;
  pageWidth: number;
  /** Extra content under the copy, used by the alerts slide. */
  children?: ReactNode;
}

export const OnboardingSlideView = ({ slide, pageWidth, children }: Props) => {
  const isWelcome = slide.kind === "welcome";
  const isFinish = slide.kind === "finish";

  return (
    <View
      style={{ width: pageWidth }}
      className="flex-1 justify-center gap-6 px-8"
    >
      <View
        className={cn(
          "items-center justify-center self-start rounded-[28px] bg-primary/12",
          isWelcome || isFinish ? "size-36" : "size-20",
        )}
      >
        <Icon
          as={slide.icon}
          className={cn(
            "text-primary",
            isWelcome || isFinish ? "size-16" : "size-9",
          )}
        />
      </View>

      <View className="gap-3">
        <Text
          className={cn(
            "font-extrabold",
            isWelcome || isFinish
              ? "text-[32px] leading-[38px]"
              : "text-[26px] leading-[32px]",
          )}
        >
          {slide.title}
        </Text>
        <Text className="text-[16px] leading-[25px] text-muted-foreground">
          {slide.body}
        </Text>
      </View>

      {children}
    </View>
  );
};
