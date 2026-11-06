import { Tabs } from "expo-router";
import {
  CalendarCheck,
  ChevronRight,
  HeartPulse,
  MessageSquare,
  ShieldCheck,
} from "lucide-react-native";
import { useUniwind } from "uniwind";
import { NAV_THEME } from "@/lib/theme";

const TabsLayout = () => {
  const { theme } = useUniwind();
  const navTheme = NAV_THEME[theme === "dark" ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: navTheme.colors.background },
        tabBarActiveTintColor: navTheme.colors.primary,
        tabBarInactiveTintColor: navTheme.colors.text,
        tabBarStyle: {
          backgroundColor: navTheme.colors.card,
          borderTopColor: navTheme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <HeartPulse size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Care",
          tabBarIcon: ({ color }) => <ChevronRight size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: "Visits",
          tabBarIcon: ({ color }) => <CalendarCheck size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <ShieldCheck size={22} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
