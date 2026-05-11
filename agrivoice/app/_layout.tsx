/**
 * Root layout — initializes services and wraps navigation.
 * Runs once on app launch regardless of which screen opens.
 */

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { initDatabase, seedDatabase } from "@/services/DatabaseService";
import { initAudio } from "@/services/AudioService";
import { registerBackgroundSync } from "@/services/SyncService";

export default function RootLayout() {
  useEffect(() => {
    // Fire-and-forget startup tasks — non-blocking
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
    }

    bootstrap();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
