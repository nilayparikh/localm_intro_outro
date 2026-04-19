import type { ThemeDefinition } from "../templates/types";
import {
  createThemeDefinition,
  resolveThemeDefinition,
} from "../themes/themeDefinitions";

export interface ThemeEditorState {
  selectedThemeId: string;
  draft: ThemeDefinition;
}

export function buildThemeEditorState({
  themes,
  selectedThemeId,
}: {
  themes: ThemeDefinition[];
  selectedThemeId: string;
}): ThemeEditorState {
  const selectedTheme = resolveThemeDefinition(themes, selectedThemeId);

  return {
    selectedThemeId: selectedTheme.id,
    draft: createThemeDefinition(selectedTheme),
  };
}

export function duplicateThemeDefinition(
  theme: ThemeDefinition,
): ThemeDefinition {
  return createThemeDefinition({
    ...theme,
    id: undefined,
    name: `${theme.name} Copy`,
    updatedAt: Date.now(),
  });
}

export function shouldHydrateThemeDraft({
  draft,
  themes,
  selectedThemeId,
}: {
  draft: ThemeDefinition | null;
  themes: ThemeDefinition[];
  selectedThemeId: string;
}): boolean {
  if (!draft) {
    return true;
  }

  if (!selectedThemeId) {
    return false;
  }

  return themes.some((theme) => theme.id === selectedThemeId);
}

export function buildThemeExportFileName(themeName: string): string {
  const normalized = themeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${normalized || "theme"}.json`;
}
