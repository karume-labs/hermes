import "@/global.css";

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { PortalHost } from "@rn-primitives/portal";
import { Stack, useRouter, useSegments } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useUniwind } from "uniwind";
import { getPatientToken } from "@/lib/auth";
import "@/lib/notifications";
import { NAV_THEME } from "@/lib/theme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// A stored bearer token is the sign-in state; every screen below the gate
// assumes a patient session and the API rejects anonymous reads.
const AuthGate = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = await getPatientToken();
      const onSignIn = segments[0] === "sign-in";
      setChecked(true);
      if (token === null && !onSignIn) router.replace("/sign-in");
      if (token !== null && onSignIn) router.replace("/");
    })();
  }, [router, segments]);

  if (!checked) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  return <>{children}</>;
};

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
      <AuthGate>
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
            name="sign-in"
            options={{ headerShown: false, title: "Sign in" }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="care-action" options={{ title: "Your result" }} />
          <Stack.Screen name="booking" options={{ title: "Book a visit" }} />
          <Stack.Screen
            name="notifications"
            options={{ headerShown: false, title: "Notifications" }}
          />
        </Stack>
      </AuthGate>
      <PortalHost />
    </ThemeProvider>
  );
};

export default RootLayout;
