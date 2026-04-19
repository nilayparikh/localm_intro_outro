import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db";

export interface UserSettings {
  display_name: string;
  website: string;
  social_accounts: Record<string, string>;
  logo_url: string | null;
}

const DEFAULT_SETTINGS: UserSettings = {
  display_name: "",
  website: "",
  social_accounts: {
    x_twitter: "",
    linkedin: "",
    github: "",
    medium: "",
    youtube: "",
    instagram: "",
  },
  logo_url: null,
};

export function useSettings() {
  const { db } = useDatabase();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!db) return;
    const sub = db.settings.findOne("user_settings").$.subscribe((doc: any) => {
      if (doc) {
        setSettings({
          display_name: doc.display_name ?? "",
          website: doc.website ?? "",
          social_accounts:
            doc.social_accounts ?? DEFAULT_SETTINGS.social_accounts,
          logo_url: doc.logo_url ?? null,
        });
      }
    });
    return () => sub.unsubscribe();
  }, [db]);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!db) return;
      await db.settings.upsert({
        id: "user_settings",
        ...settings,
        ...updates,
        updatedAt: Date.now(),
      });
    },
    [db, settings],
  );

  return { settings, updateSettings };
}
