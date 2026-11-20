import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import {
  CalendarDays,
  HeartHandshake,
  HeartPulse,
  MessageSquare,
  UserRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";
import {
  TAB_BAR_LABEL_FONT_SIZE,
  TAB_BAR_LABEL_GAP,
  TAB_BAR_LABEL_LINE_HEIGHT,
  TAB_BAR_PADDING_BOTTOM,
  TAB_BAR_PADDING_TOP,
  tabBarHeight,
} from "@/lib/tab-bar-metrics";
import { NAV_THEME, THEME } from "@/lib/theme";

interface TabBarIconProps {
  focused: boolean;
}

/** Icon inside a soft pill when its tab is active: shape first, tint second. */
const TabIcon = ({
  icon,
  focused,
}: {
  icon: ReactNode;
  focused: boolean;
}): ReactNode => (
  <View
    className={
      focused
        ? "h-8 w-14 items-center justify-center rounded-full bg-primary/12"
        : "h-8 w-14 items-center justify-center rounded-full bg-transparent"
    }
  >
    {icon}
  </View>
);

const TabsLayout = () => {
  const { theme } = useUniwind();
  const scheme = theme === "dark" ? "dark" : "light";
  const navTheme = NAV_THEME[scheme];
  const insets = useSafeAreaInsets();

  const haptic = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  // The bar's own tint is ignored in favour of the shared tokens, so the icon
  // and its label never disagree about the active state.
  const icon = (
    Glyph: typeof HeartPulse,
  ): ((props: TabBarIconProps) => ReactNode) => {
    const TabBarIcon = ({ focused }: TabBarIconProps): ReactNode => (
      <TabIcon
        focused={focused}
        icon={
          <Glyph
            size={focused ? 22 : 21}
            strokeWidth={focused ? 2.3 : 1.9}
            color={
              focused ? THEME[scheme].foreground : THEME[scheme].mutedForeground
            }
          />
        }
      />
    );
    return TabBarIcon;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: navTheme.colors.background },
        tabBarActiveTintColor: THEME[scheme].foreground,
        tabBarInactiveTintColor: THEME[scheme].mutedForeground,
        tabBarStyle: {
          backgroundColor: navTheme.colors.card,
          borderTopColor: navTheme.colors.border,
          borderTopWidth: 1,
          height: tabBarHeight(insets.bottom),
          paddingTop: TAB_BAR_PADDING_TOP,
          paddingBottom: TAB_BAR_PADDING_BOTTOM + insets.bottom,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: TAB_BAR_LABEL_FONT_SIZE,
          lineHeight: TAB_BAR_LABEL_LINE_HEIGHT,
          letterSpacing: 0.1,
          fontFamily: "PlusJakartaSans_700Bold",
          marginTop: TAB_BAR_LABEL_GAP,
        },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{ tabPress: haptic }}
        options={{ title: "Results", tabBarIcon: icon(HeartPulse) }}
      />
      <Tabs.Screen
        name="journey"
        listeners={{ tabPress: haptic }}
        options={{ title: "Care", tabBarIcon: icon(HeartHandshake) }}
      />
      <Tabs.Screen
        name="visits"
        listeners={{ tabPress: haptic }}
        options={{ title: "Visits", tabBarIcon: icon(CalendarDays) }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{ tabPress: haptic }}
        options={{ title: "Messages", tabBarIcon: icon(MessageSquare) }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: haptic }}
        options={{ title: "Profile", tabBarIcon: icon(UserRound) }}
      />
    </Tabs>
  );
};

export default TabsLayout;
