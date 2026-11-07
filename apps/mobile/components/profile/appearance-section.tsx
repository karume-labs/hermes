import type * as React from "react";
import { Pressable, View } from "react-native";
import { ListSection } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import type { ThemePreference } from "@/lib/theme-preference";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

interface AppearanceSectionProps {
  preference: ThemePreference;
  onChoose: (preference: ThemePreference) => void;
}

export const AppearanceSection = ({
  preference,
  onChoose,
}: AppearanceSectionProps): React.ReactNode => (
  <ListSection
    title="Appearance"
    footer="System follows your phone's light or dark setting."
  >
    <View className="flex-row gap-2 px-4 py-3">
      {THEME_OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChoose(option.value)}
            className={`flex-1 items-center rounded-control border py-2.5 ${
              selected
                ? "border-primary bg-primary/15"
                : "border-border bg-card"
            }`}
          >
            <Text
              className={`text-[14px] font-bold ${
                selected ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </ListSection>
);
