/**
 * useOfflineSync — foreground sync hook for the Settings screen.
 * Background sync is handled by SyncService's TaskManager task.
 */

import { useState, useCallback } from "react";
import { manualSync } from "@/services/SyncService";
import { useSettingsStore } from "@/store/settingsStore";

export interface UseOfflineSyncResult {
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncMessage: string;
  triggerSync: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const { lastSyncAt, setLastSyncAt } = useSettingsStore();

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage("Syncing...");

    const result = await manualSync();
    setSyncMessage(result.message);

    if (result.success) {
      setLastSyncAt(new Date().toISOString());
    }

    setIsSyncing(false);
  }, [setLastSyncAt]);

  return { isSyncing, lastSyncAt, syncMessage, triggerSync };
}
