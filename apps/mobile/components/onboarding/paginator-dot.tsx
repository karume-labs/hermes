import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const NARROW = 8;
const WIDE = 22;
/** Long enough to read as a move, short enough not to feel like a wait. */
const TRANSITION_MS = 200;

/**
 * Pill dot that widens when its page is on screen. The losing dot snaps back
 * instead of animating, so two dots can never look active at once.
 */
export const PaginatorDot = ({ active }: { active: boolean }) => {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    if (progress.value === 1) return;
    progress.value = withTiming(1, { duration: TRANSITION_MS });
  });

  const style = useAnimatedStyle(() => ({
    width: NARROW + (WIDE - NARROW) * progress.value,
    opacity: 0.35 + 0.65 * progress.value,
  }));

  return (
    <Animated.View className="h-2 rounded-full bg-primary" style={style} />
  );
};
