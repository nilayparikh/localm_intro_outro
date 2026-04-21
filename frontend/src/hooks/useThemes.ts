import { useCallback, useMemo } from "react";
import { useAzureCachedCollection, type CachedCrudCollection } from "@common";
import { useDatabaseContext } from "../db";
import { useAuth } from "../auth";
import type { ThemeDefinition } from "../templates/types";
import {
  buildThemeExportData,
  resolveThemeDefinition,
  toRenderableTheme,
} from "../themes/themeDefinitions";
import {
  createThemeRemoteAdapter,
  mergeStoredThemesWithBuiltIns,
  prepareThemeForSave,
} from "../persistence/themePersistence";

function sortThemes(themes: ThemeDefinition[]): ThemeDefinition[] {
  return [...themes].sort((left, right) => left.name.localeCompare(right.name));
}

export function useThemes() {
  const db = useDatabaseContext();
  const { authState } = useAuth();
  const remote = useMemo(
    () => (authState ? createThemeRemoteAdapter(authState) : null),
    [authState],
  );
  const prepareThemeSave = useCallback(
    (theme: Partial<ThemeDefinition>, currentStoredThemes: ThemeDefinition[]) =>
      prepareThemeForSave(
        theme,
        mergeStoredThemesWithBuiltIns(currentStoredThemes),
      ),
    [],
  );
  const {
    records: storedThemes,
    save,
    remove,
    refresh,
  } = useAzureCachedCollection<ThemeDefinition, Partial<ThemeDefinition>>({
    collection: db.themes as unknown as CachedCrudCollection<ThemeDefinition>,
    remote,
    loadStrategy: remote ? "remote-first" : "cache-first",
    prepareForSave: prepareThemeSave,
  });
  const themes = useMemo(
    () => mergeStoredThemesWithBuiltIns(storedThemes),
    [storedThemes],
  );

  const saveTheme = useCallback(
    async (theme: Partial<ThemeDefinition>) => {
      const savedTheme = await save(theme);
      return savedTheme.id;
    },
    [save],
  );

  const deleteTheme = useCallback(
    async (themeId: string) => {
      await remove(themeId);
    },
    [remove],
  );

  const exportTheme = useCallback(
    (themeId: string) =>
      buildThemeExportData(resolveThemeDefinition(themes, themeId)),
    [themes],
  );

  const exportThemes = useCallback(
    () => JSON.stringify(sortThemes(themes), null, 2),
    [themes],
  );

  const themeOptions = useMemo(
    () => themes.map((theme) => ({ value: theme.id, label: theme.name })),
    [themes],
  );

  const getTheme = useCallback(
    (themeId: string) => resolveThemeDefinition(themes, themeId),
    [themes],
  );

  const getRenderableTheme = useCallback(
    (themeId: string) =>
      toRenderableTheme(resolveThemeDefinition(themes, themeId)),
    [themes],
  );

  return {
    themes,
    themeOptions,
    saveTheme,
    deleteTheme,
    refreshThemes: refresh,
    exportTheme,
    exportThemes,
    getTheme,
    getRenderableTheme,
  };
}
