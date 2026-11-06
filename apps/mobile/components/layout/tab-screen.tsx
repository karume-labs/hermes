import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabScreenProps {
  children: ReactNode;
}

/** Headerless tab content starts below the status bar, not underneath it. */
export const TabScreen = ({ children }: TabScreenProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {children}
    </View>
  );
};
