import type { ReactNode } from "react";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

const PULSE_DURATION = 1200;

/** Stable keys for placeholder rows: no index keys, no remounts. */
export const skeletonKeys = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `skeleton-${index}`);

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * A placeholder shaped like the content it replaces. The pulse is driven by
 * Reanimated because uniwind does not compile CSS keyframes for native.
 */
export const Skeleton = ({ className, style, children }: SkeletonProps) => {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      className={cn("bg-muted", className)}
      style={[pulseStyle, style]}
    >
      {children}
    </Animated.View>
  );
};
