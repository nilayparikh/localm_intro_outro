import type { StoredAuthState } from "../auth";
import type { ThemeDefinition } from "../templates/types";
import { createAzureTableCrudAdapter } from "./azureCollectionAdapters";
import {
  BUILT_IN_THEME_DEFINITIONS,
  createThemeDefinition,
  resolveThemeDefinition,
} from "../themes/themeDefinitions";

function sortThemes(themes: ThemeDefinition[]): ThemeDefinition[] {
  return [...themes].sort((left, right) => left.name.localeCompare(right.name));
}

export function mergeStoredThemesWithBuiltIns(
  storedThemes: ThemeDefinition[],
): ThemeDefinition[] {
  const mergedThemes = new Map(
    BUILT_IN_THEME_DEFINITIONS.map((theme) => [theme.id, theme]),
  );

  for (const theme of storedThemes) {
    mergedThemes.set(theme.id, theme);
  }

  return sortThemes([...mergedThemes.values()]);
}

export function prepareThemeForSave(
  theme: Partial<ThemeDefinition>,
  themes: ThemeDefinition[],
): ThemeDefinition {
  const nextThemeId = theme.id ?? createThemeDefinition().id;

  return createThemeDefinition({
    ...resolveThemeDefinition(themes, theme.id ?? ""),
    ...theme,
    id: nextThemeId,
    updatedAt: Date.now(),
  });
}

export function createThemeRemoteAdapter(authState: StoredAuthState) {
  return createAzureTableCrudAdapter<ThemeDefinition>("themes", authState);
}
