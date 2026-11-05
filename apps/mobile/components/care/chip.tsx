import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  className?: string;
  textClassName?: string;
  icon?: ReactNode;
}

export const Chip = ({ label, className, textClassName, icon }: ChipProps) => (
  <View
    className={cn(
      "flex-row items-center gap-1.5 rounded-full px-3 py-1",
      className,
    )}
  >
    {icon}
    <Text
      className={cn("text-[12px] font-bold tracking-[0.01em]", textClassName)}
    >
      {label}
    </Text>
  </View>
);
