/**
 * Root layout — initializes services and wraps navigation.
 * Runs once on app launch regardless of which screen opens.
 *
 * Pattern: SplashScreen.preventAutoHideAsync() keeps the native splash
 * visible while bootstrap runs. The Stack is always rendered (never null)
 * so router.replace("/onboarding") has a live navigation tree to target.
 */

import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { initDatabase, seedDatabase } from "@/services/DatabaseService";
import { initAudio } from "@/services/AudioService";
import { registerBackgroundSync } from "@/services/SyncService";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Keep native splash visible until bootstrap completes
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        await seedDatabase();
        await initAudio();
        await registerBackgroundSync();
      } catch (e) {
        // Bootstrap errors are non-fatal — app still works offline from bundled data
        console.warn("[Bootstrap] Startup error (non-fatal):", e);
      }

      // Check first-launch flag — navigate to onboarding if not done
      const done = await AsyncStorage.getItem("onboarding_done");
      if (!done) {
        router.replace("/onboarding");
      }

      // Navigation decided — safe to reveal the app
      await SplashScreen.hideAsync().catch(() => {});
    }

    bootstrap();
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}
