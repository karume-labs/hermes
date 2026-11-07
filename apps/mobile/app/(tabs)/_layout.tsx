import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import {
  CalendarDays,
  HeartHandshake,
  HeartPulse,
  MessageSquare,
  UserRound,
} from "lucide-react-native";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";
import { NAV_THEME, THEME } from "@/lib/theme";

const TabsLayout = () => {
  const { theme } = useUniwind();
  const scheme = theme === "dark" ? "dark" : "light";
  const navTheme = NAV_THEME[scheme];
  const insets = useSafeAreaInsets();

  const haptic = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: navTheme.colors.background },
        tabBarActiveTintColor: navTheme.colors.primary,
        tabBarInactiveTintColor: THEME[scheme].mutedForeground,
        tabBarStyle: {
          backgroundColor: navTheme.colors.card,
          borderTopColor: navTheme.colors.border,
          borderTopWidth: 0.5,
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 4,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "PlusJakartaSans_500Medium",
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{ tabPress: haptic }}
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <HeartPulse
              size={focused ? 23 : 22}
              strokeWidth={focused ? 2.4 : 1.9}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        listeners={{ tabPress: haptic }}
        options={{
          title: "Care",
          tabBarIcon: ({ color, focused }) => (
            <HeartHandshake
              size={focused ? 23 : 22}
              strokeWidth={focused ? 2.4 : 1.9}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="visits"
        listeners={{ tabPress: haptic }}
        options={{
          title: "Visits",
          tabBarIcon: ({ color, focused }) => (
            <CalendarDays
              size={focused ? 23 : 22}
              strokeWidth={focused ? 2.4 : 1.9}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{ tabPress: haptic }}
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare
              size={focused ? 23 : 22}
              strokeWidth={focused ? 2.4 : 1.9}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: haptic }}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <UserRound
              size={focused ? 23 : 22}
              strokeWidth={focused ? 2.4 : 1.9}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
