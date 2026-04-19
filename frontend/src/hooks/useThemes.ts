import { useCallback, useEffect, useMemo, useState } from "react";
import { useDatabaseContext } from "../db";
import type { ThemeDefinition } from "../templates/types";
import {
  BUILT_IN_THEME_DEFINITIONS,
  buildThemeExportData,
  createThemeDefinition,
  resolveThemeDefinition,
  toRenderableTheme,
} from "../themes/themeDefinitions";

function sortThemes(themes: ThemeDefinition[]): ThemeDefinition[] {
  return [...themes].sort((left, right) => left.name.localeCompare(right.name));
}

export function useThemes() {
  const db = useDatabaseContext();
  const [themes, setThemes] = useState<ThemeDefinition[]>(
    sortThemes(BUILT_IN_THEME_DEFINITIONS),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const existingThemes = await db.themes.find().exec();
      if (existingThemes.length === 0) {
        await Promise.all(
          BUILT_IN_THEME_DEFINITIONS.map((theme) => db.themes.upsert(theme)),
        );
      }
    })();

    const subscription = db.themes.find().$.subscribe((docs: any[]) => {
      if (cancelled) {
        return;
      }

      const nextThemes = docs.map((doc) => doc.toJSON() as ThemeDefinition);
      setThemes(
        nextThemes.length > 0
          ? sortThemes(nextThemes)
          : sortThemes(BUILT_IN_THEME_DEFINITIONS),
      );
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [db]);

  const saveTheme = useCallback(
    async (theme: Partial<ThemeDefinition>) => {
      const nextTheme = createThemeDefinition({
        ...resolveThemeDefinition(themes, theme.id ?? ""),
        ...theme,
        id: theme.id ?? createThemeDefinition().id,
        updatedAt: Date.now(),
      });

      await db.themes.upsert(nextTheme);
      return nextTheme.id;
    },
    [db, themes],
  );

  const deleteTheme = useCallback(
    async (themeId: string) => {
      const doc = await db.themes.findOne(themeId).exec();
      if (doc) {
        await doc.remove();
      }
    },
    [db],
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
    exportTheme,
    exportThemes,
    getTheme,
    getRenderableTheme,
  };
}
