/**
 * Root layout — initializes services and wraps navigation.
 * Runs once on app launch regardless of which screen opens.
 */

import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { initDatabase, seedDatabase } from "@/services/DatabaseService";
import { initAudio } from "@/services/AudioService";
import { registerBackgroundSync } from "@/services/SyncService";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        await seedDatabase();
        await initAudio();
        await registerBackgroundSync();
      } catch (e) {
        console.warn("[Bootstrap] Startup error (non-fatal):", e);
      }

      // Show onboarding on first launch
      const done = await AsyncStorage.getItem("onboarding_done");
      if (!done) {
        router.replace("/onboarding");
      }

      setReady(true);
    }

    bootstrap();
  }, []);

  if (!ready) return null;

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
