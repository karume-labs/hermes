import "@/global.css";

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useUniwind } from "uniwind";
import { BrandHeader } from "@/components/brand/brand-header";
import "@/lib/notifications";
import { NAV_THEME } from "@/lib/theme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const RootLayout = () => {
  const { theme } = useUniwind();
  const scheme = theme === "dark" ? "dark" : "light";
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  const navTheme = NAV_THEME[scheme];

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: navTheme.colors.background },
          headerTintColor: navTheme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: navTheme.colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerTitle: () => <BrandHeader title="Your care" /> }}
        />
        <Stack.Screen name="care-action" options={{ title: "Your result" }} />
        <Stack.Screen name="booking" options={{ title: "Book a visit" }} />
        <Stack.Screen name="messages" options={{ title: "Messages" }} />
        <Stack.Screen name="journey" options={{ title: "Care journey" }} />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
};

export default RootLayout;
