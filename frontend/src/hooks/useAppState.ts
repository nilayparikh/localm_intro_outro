import { useState, useEffect, useCallback, useRef } from "react";
import { useDatabaseContext } from "../db";

export interface DraftBannerState {
  bannerId: string | null;
  name: string;
  templateId: string;
  themeId: string;
  platformId: string;
  fieldValues: Record<string, string>;
  borderWidth: number;
  borderColor: string;
  fontPairId: string;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  fontSize: number;
  brandLogoUrl: string | null;
  brandLogoSize: number;
  showCopyrightMessage: boolean;
  copyrightText: string;
  tutorialImageUrl: string | null;
  tutorialImageSize: number;
  tutorialImageBottomPadding: number;
  tutorialImageOpacity: number;
}

export interface AppState {
  autoSaveOnLogout: boolean;
  autoStartSync: boolean;
  currentDraft: DraftBannerState | null;
  draftDirty: boolean;
  lastSyncAt: number | null;
  lastSyncStatus: "idle" | "syncing" | "success" | "error";
  lastSyncMessage: string;
}

export const DEFAULT_APP_STATE: AppState = {
  autoSaveOnLogout: true,
  autoStartSync: false,
  currentDraft: null,
  draftDirty: false,
  lastSyncAt: null,
  lastSyncStatus: "idle",
  lastSyncMessage: "Sync has not run yet.",
};

const APP_STATE_ID = "ui_state";

export function useAppState() {
  const db = useDatabaseContext();
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    const sub = db.app_state.findOne(APP_STATE_ID).$.subscribe((doc: any) => {
      if (!doc) {
        setAppState(DEFAULT_APP_STATE);
        setIsHydrated(true);
        return;
      }

      setAppState({
        autoSaveOnLogout: doc.autoSaveOnLogout ?? true,
        autoStartSync: doc.autoStartSync ?? false,
        currentDraft: doc.currentDraft ?? null,
        draftDirty: doc.draftDirty ?? false,
        lastSyncAt: doc.lastSyncAt ?? null,
        lastSyncStatus: doc.lastSyncStatus ?? "idle",
        lastSyncMessage:
          doc.lastSyncMessage ?? DEFAULT_APP_STATE.lastSyncMessage,
      });
      setIsHydrated(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const updateAppState = useCallback(
    async (updates: Partial<AppState>) => {
      await db.app_state.upsert({
        id: APP_STATE_ID,
        ...appStateRef.current,
        ...updates,
        updatedAt: Date.now(),
      });
    },
    [db],
  );

  return { appState, updateAppState, isHydrated };
}
