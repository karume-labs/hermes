import { View } from "react-native";
import { Skeleton, skeletonKeys } from "@/components/ui/skeleton";

interface ScreenSkeletonProps {
  /** Number of placeholder rows; mirrors what the screen will show. */
  rows?: number;
  /** Show the large header block while the first read lands. */
  withHeader?: boolean;
}

/**
 * Loading mirror for list screens: header lines, then grouped rows with the
 * same padding and hairline rhythm as the real content, so nothing jumps.
 */
export const ScreenSkeleton = ({
  rows = 4,
  withHeader = true,
}: ScreenSkeletonProps) => (
  <View className="gap-5">
    {withHeader ? (
      <View className="gap-2 px-5 pt-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-3.5 w-64 rounded-full" />
      </View>
    ) : null}

    <View className="gap-2">
      <Skeleton className="mx-5 h-3 w-24 rounded-full" />
      <View className="mx-4 overflow-hidden rounded-[18px] border border-border/70">
        {skeletonKeys(rows).map((key, index) => (
          <View
            key={key}
            className={
              index === 0
                ? "flex-row items-center gap-3 px-4 py-4"
                : "flex-row items-center gap-3 border-t border-border/70 px-4 py-4"
            }
          >
            <Skeleton className="h-9 w-9 rounded-[11px]" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-3.5 w-3/5 rounded-full" />
              <Skeleton className="h-3 w-4/5 rounded-full" />
            </View>
            <Skeleton className="h-6 w-14 rounded-full" />
          </View>
        ))}
      </View>
    </View>
  </View>
);
