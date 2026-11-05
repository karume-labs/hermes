import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  className?: string;
  textClassName?: string;
}

export const Chip = ({ label, className, textClassName }: ChipProps) => (
  <View className={cn("rounded-full px-3 py-1", className)}>
    <Text className={cn("text-xs font-semibold", textClassName)}>{label}</Text>
  </View>
);
