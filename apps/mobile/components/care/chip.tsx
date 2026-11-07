import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * One colour, three weights. Meaning rides on the weight instead of a set of
 * status colours: strong is the thing that needs someone now, soft is waiting,
 * quiet is settled. Icon and label keep the signal without colour.
 */
export type ChipTone = "strong" | "soft" | "quiet";

const SURFACE: Record<ChipTone, string> = {
  strong: "bg-foreground",
  soft: "bg-accent",
  quiet: "border border-border bg-transparent",
};

const LABEL: Record<ChipTone, string> = {
  strong: "text-background",
  soft: "text-accent-foreground",
  quiet: "text-muted-foreground",
};

interface ChipProps {
  label: string;
  tone?: ChipTone;
  className?: string;
  textClassName?: string;
  icon?: ReactNode;
}

export const Chip = ({
  label,
  tone = "quiet",
  className,
  textClassName,
  icon,
}: ChipProps) => (
  <View
    className={cn(
      "flex-row items-center gap-1.5 rounded-full px-2.5 py-1",
      SURFACE[tone],
      className,
    )}
  >
    {icon}
    <Text
      className={cn(
        "text-[12px] font-bold tracking-[0.01em]",
        LABEL[tone],
        textClassName,
      )}
    >
      {label}
    </Text>
  </View>
);
