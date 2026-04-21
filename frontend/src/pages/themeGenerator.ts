import type { ThemeDefinition } from "../templates/types";
import {
  buildThemeExportData,
  buildThemeReactPageSource,
  createThemeDefinition,
  resolveThemeDefinition,
} from "../themes/themeDefinitions";

export interface ThemeExportBundleEntry {
  fileName: string;
  content: string;
}

function sortThemes(themes: ThemeDefinition[]): ThemeDefinition[] {
  return [...themes].sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeExportStem(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildThemeExportBaseName(themeName: string): string {
  return buildThemeExportFileName(themeName).replace(/\.json$/i, "");
}

function buildUniqueThemeFolderName(
  theme: ThemeDefinition,
  usedFolderNames: Set<string>,
): string {
  const baseName = buildThemeExportBaseName(theme.name);
  let nextName = baseName || "theme";

  if (!usedFolderNames.has(nextName)) {
    usedFolderNames.add(nextName);
    return nextName;
  }

  const themeIdSuffix = normalizeExportStem(theme.id) || "theme";
  nextName = `${nextName}_${themeIdSuffix}`;

  let duplicateIndex = 2;
  while (usedFolderNames.has(nextName)) {
    nextName = `${baseName || "theme"}_${themeIdSuffix}_${duplicateIndex}`;
    duplicateIndex += 1;
  }

  usedFolderNames.add(nextName);
  return nextName;
}

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
  const normalized = normalizeExportStem(themeName);

  return `${normalized || "theme"}.json`;
}

export function buildThemeExportBundleEntries(
  theme: ThemeDefinition,
): ThemeExportBundleEntry[] {
  const jsonFileName = buildThemeExportFileName(theme.name);
  const baseName = buildThemeExportBaseName(theme.name);

  return [
    {
      fileName: jsonFileName,
      content: buildThemeExportData(theme),
    },
    {
      fileName: `${baseName}_page.tsx`,
      content: buildThemeReactPageSource(theme),
    },
  ];
}

export function buildThemeLibraryExportBundleEntries(
  themes: ThemeDefinition[],
): ThemeExportBundleEntry[] {
  const sortedThemes = sortThemes(themes);
  const entries: ThemeExportBundleEntry[] = [
    {
      fileName: "localm_theme_library.json",
      content: JSON.stringify(sortedThemes, null, 2),
    },
  ];
  const usedFolderNames = new Set<string>();

  for (const theme of sortedThemes) {
    const folderName = buildUniqueThemeFolderName(theme, usedFolderNames);
    for (const entry of buildThemeExportBundleEntries(theme)) {
      entries.push({
        fileName: `themes/${folderName}/${entry.fileName}`,
        content: entry.content,
      });
    }
  }

  return entries;
}
