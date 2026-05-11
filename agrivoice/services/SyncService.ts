/**
 * SyncService.ts
 *
 * Delta sync logic for AgriVoice.
 * Runs as a background task using Expo Background Fetch.
 *
 * Sync strategy:
 *  - Only syncs when a WiFi connection is detected (conserve 2G/3G data)
 *  - Downloads a manifest JSON to check which records changed
 *  - Only fetches records newer than local updated_at timestamps
 *  - Stores updated records in SQLite and caches new audio files
 *
 * No paid APIs. Sync endpoint is a static JSON file on a CDN / GitHub Pages.
 */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Network from "expo-network";
import { Advisory, PestRecord, SyncManifest } from "@/types";
import {
  upsertAdvisory,
  upsertPest,
  getSyncMeta,
  setSyncMeta,
} from "@/services/DatabaseService";
import { cacheAudioFile } from "@/services/AudioService";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SYNC_TASK_NAME = "agrivoice-background-sync";

// Replace with your actual CDN URL (GitHub Pages, Cloudflare Pages, etc.)
const SYNC_BASE_URL = "https://your-cdn.example.com/agrivoice/data";
const MANIFEST_URL = `${SYNC_BASE_URL}/manifest.json`;

// Sync every 6 hours when WiFi is available
const SYNC_INTERVAL_SECONDS = 6 * 60 * 60;

// ─── Background task registration ────────────────────────────────────────────

/**
 * Define the background task. Must be called at module level (top of file)
 * so TaskManager can register it before the app finishes loading.
 */
TaskManager.defineTask(SYNC_TASK_NAME, async () => {
  try {
    const didSync = await runSync();
    return didSync
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    console.warn("[SyncService] Background sync failed:", e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Registration helpers ─────────────────────────────────────────────────────

export async function registerBackgroundSync(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();

  // Background fetch is restricted on some devices (battery saver mode)
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    console.warn("[SyncService] Background fetch not available on this device.");
    return;
  }

  await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
    minimumInterval: SYNC_INTERVAL_SECONDS,
    stopOnTerminate: false,   // continue after app is killed
    startOnBoot: true,        // resume after device reboot
  });
}

export async function unregisterBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_TASK_NAME);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME);
  }
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

/**
 * Main sync function. Called by background task AND by foreground sync button.
 * Returns true if any new data was downloaded.
 */
export async function runSync(): Promise<boolean> {
  // Only sync on WiFi — preserve mobile data for low-income farmers
  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected) return false;
  if (network.type !== Network.NetworkStateType.WIFI) return false;

  let manifest: SyncManifest;
  try {
    manifest = await fetchManifest();
  } catch {
    return false; // Network error — skip silently
  }

  const lastSyncVersion = parseInt(
    (await getSyncMeta("manifest_version")) ?? "0",
    10
  );

  if (manifest.version <= lastSyncVersion) return false; // Already up to date

  let updated = false;

  // Delta-sync advisories
  for (const entry of manifest.advisories) {
    const localUpdatedAt = await getSyncMeta(`advisory_${entry.id}`);
    if (localUpdatedAt && localUpdatedAt >= entry.updatedAt) continue;

    try {
      const advisory = await fetchAdvisory(entry.id);
      await upsertAdvisory(advisory);
      await setSyncMeta(`advisory_${entry.id}`, entry.updatedAt);

      // Cache audio files for all three languages
      for (const lang of ["en", "sw", "ha"] as const) {
        const audioPath = (advisory as Record<string, string>)[`audio_url_${lang}`];
        if (audioPath) {
          await cacheAudioFile(`${SYNC_BASE_URL}/${audioPath}`, audioPath);
        }
      }

      updated = true;
    } catch {
      // Partial failure is acceptable — skip this record, retry next cycle
    }
  }

  // Delta-sync pest records
  for (const entry of manifest.pests) {
    const localUpdatedAt = await getSyncMeta(`pest_${entry.id}`);
    if (localUpdatedAt && localUpdatedAt >= entry.updatedAt) continue;

    try {
      const pest = await fetchPest(entry.id);
      await upsertPest(pest);
      await setSyncMeta(`pest_${entry.id}`, entry.updatedAt);
      updated = true;
    } catch {
      // Skip and retry next cycle
    }
  }

  if (updated) {
    await setSyncMeta("manifest_version", String(manifest.version));
    await setSyncMeta("last_sync_at", new Date().toISOString());
  }

  return updated;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchManifest(): Promise<SyncManifest> {
  const res = await fetchWithTimeout(MANIFEST_URL, 10_000);
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  return res.json() as Promise<SyncManifest>;
}

async function fetchAdvisory(id: string): Promise<Advisory> {
  const res = await fetchWithTimeout(`${SYNC_BASE_URL}/advisories/${id}.json`, 8_000);
  if (!res.ok) throw new Error(`Advisory fetch failed: ${id}`);
  return res.json() as Promise<Advisory>;
}

async function fetchPest(id: string): Promise<PestRecord> {
  const res = await fetchWithTimeout(`${SYNC_BASE_URL}/pests/${id}.json`, 8_000);
  if (!res.ok) throw new Error(`Pest fetch failed: ${id}`);
  return res.json() as Promise<PestRecord>;
}

/**
 * fetch() with an AbortController timeout.
 * Critical for 2G networks where connections can hang indefinitely.
 */
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Manual sync (foreground) ─────────────────────────────────────────────────

export async function manualSync(): Promise<{ success: boolean; message: string }> {
  try {
    const synced = await runSync();
    const lastSync = await getSyncMeta("last_sync_at");

    if (synced) {
      return { success: true, message: `Data updated. Last sync: ${lastSync ?? "now"}` };
    }

    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected) {
      return { success: false, message: "No internet connection. Using offline data." };
    }
    if (network.type !== Network.NetworkStateType.WIFI) {
      return { success: false, message: "WiFi required for sync. Connect to WiFi and try again." };
    }

    return { success: true, message: `Data is up to date. Last sync: ${lastSync ?? "never"}` };
  } catch (e) {
    return { success: false, message: "Sync failed. Please try again." };
  }
}
