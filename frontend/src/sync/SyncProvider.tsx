import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "../auth";
import { useDatabaseContext } from "../db";
import { useAppState } from "../hooks/useAppState";
import { syncDatabaseOnce } from "./azureTableSync";

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncStatus: "idle" | "syncing" | "success" | "error";
  lastSyncAt: number | null;
  lastSyncMessage: string;
  manualSync: () => Promise<void>;
  syncOnSave: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const db = useDatabaseContext();
  const { appState, updateAppState } = useAppState();
  const [isSyncing, setIsSyncing] = useState(false);
  const inFlightSyncRef = useRef<Promise<void> | null>(null);

  const runSync = useCallback(
    async ({
      showSuccessToast,
      showErrorToast,
    }: {
      showSuccessToast: boolean;
      showErrorToast: boolean;
    }) => {
      if (!authState) {
        return;
      }

      if (inFlightSyncRef.current) {
        await inFlightSyncRef.current;
        return;
      }

      const syncPromise = (async () => {
        setIsSyncing(true);
        await updateAppState({
          lastSyncStatus: "syncing",
          lastSyncMessage: "Syncing with Azure Table Storage...",
        });

        try {
          await syncDatabaseOnce(db, authState);

          const lastSyncAt = Date.now();
          await updateAppState({
            lastSyncAt,
            lastSyncStatus: "success",
            lastSyncMessage: "Sync completed successfully.",
          });

          if (showSuccessToast) {
            toast.success("Sync complete");
          }
        } catch (error: any) {
          const message = error?.message ?? "Sync failed.";
          await updateAppState({
            lastSyncStatus: "error",
            lastSyncMessage: message,
          });
          if (showErrorToast) {
            toast.error(message);
          }
        } finally {
          setIsSyncing(false);
        }
      })();

      inFlightSyncRef.current = syncPromise;
      try {
        await syncPromise;
      } finally {
        if (inFlightSyncRef.current === syncPromise) {
          inFlightSyncRef.current = null;
        }
      }
    },
    [authState, db, updateAppState],
  );

  const value = useMemo<SyncContextValue>(
    () => ({
      isSyncing,
      lastSyncStatus: appState.lastSyncStatus,
      lastSyncAt: appState.lastSyncAt,
      lastSyncMessage: appState.lastSyncMessage,
      manualSync: async () => {
        await runSync({ showSuccessToast: true, showErrorToast: true });
      },
      syncOnSave: async () => {
        await runSync({ showSuccessToast: false, showErrorToast: true });
      },
    }),
    [
      appState.lastSyncAt,
      appState.lastSyncMessage,
      appState.lastSyncStatus,
      isSyncing,
      runSync,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
