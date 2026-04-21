import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_THEME_DEFINITIONS,
  createThemeDefinition,
} from "../../src/themes/themeDefinitions";
import {
  buildThemeExportBundleEntries,
  buildThemeEditorState,
  buildThemeExportFileName,
  buildThemeLibraryExportBundleEntries,
  duplicateThemeDefinition,
  shouldHydrateThemeDraft,
} from "../../src/pages/themeGenerator";

test("buildThemeEditorState loads the selected theme when one is chosen", () => {
  const state = buildThemeEditorState({
    themes: BUILT_IN_THEME_DEFINITIONS,
    selectedThemeId: "nord",
  });

  assert.equal(state.selectedThemeId, "nord");
  assert.equal(state.draft.id, "nord");
  assert.equal(state.draft.name, "Nord");
});

test("buildThemeEditorState falls back to the default theme when selection is missing", () => {
  const state = buildThemeEditorState({
    themes: BUILT_IN_THEME_DEFINITIONS,
    selectedThemeId: "missing-theme",
  });

  assert.equal(state.selectedThemeId, "dark");
  assert.equal(state.draft.id, "dark");
});

test("duplicateThemeDefinition creates a distinct editable copy", () => {
  const duplicate = duplicateThemeDefinition(BUILT_IN_THEME_DEFINITIONS[0]!);

  assert.notEqual(duplicate.id, BUILT_IN_THEME_DEFINITIONS[0]!.id);
  assert.equal(duplicate.name, `${BUILT_IN_THEME_DEFINITIONS[0]!.name} Copy`);
  assert.deepEqual(
    duplicate.backgroundLayers,
    BUILT_IN_THEME_DEFINITIONS[0]!.backgroundLayers,
  );
});

test("shouldHydrateThemeDraft preserves an unsaved draft", () => {
  const duplicate = duplicateThemeDefinition(BUILT_IN_THEME_DEFINITIONS[0]!);

  assert.equal(
    shouldHydrateThemeDraft({
      draft: duplicate,
      themes: BUILT_IN_THEME_DEFINITIONS,
      selectedThemeId: "",
    }),
    false,
  );
});

test("buildThemeExportFileName produces a stable json filename", () => {
  assert.equal(
    buildThemeExportFileName("LocalM Core Theme"),
    "localm_core_theme.json",
  );
});

test("buildThemeExportBundleEntries returns the theme json and generated page", () => {
  const theme = createThemeDefinition({
    id: "exportable-theme",
    name: "Exportable Theme",
  });

  const entries = buildThemeExportBundleEntries(theme);

  assert.deepEqual(
    entries.map((entry) => entry.fileName),
    ["exportable_theme.json", "exportable_theme_page.tsx"],
  );
  assert.match(entries[0]?.content ?? "", /"name": "Exportable Theme"/);
  assert.match(entries[1]?.content ?? "", /Exportable Theme/);
});

test("buildThemeLibraryExportBundleEntries includes library json and per-theme files", () => {
  const entries = buildThemeLibraryExportBundleEntries([
    createThemeDefinition({ id: "theme-z", name: "Theme Z" }),
    createThemeDefinition({ id: "theme-a", name: "Theme A" }),
  ]);

  assert.deepEqual(
    entries.map((entry) => entry.fileName),
    [
      "localm_theme_library.json",
      "themes/theme_a/theme_a.json",
      "themes/theme_a/theme_a_page.tsx",
      "themes/theme_z/theme_z.json",
      "themes/theme_z/theme_z_page.tsx",
    ],
  );

  assert.match(entries[0]?.content ?? "", /"name": "Theme A"/);
  assert.match(entries[0]?.content ?? "", /"name": "Theme Z"/);
  assert.match(entries[2]?.content ?? "", /Theme A/);
  assert.match(entries[4]?.content ?? "", /Theme Z/);
});

test("buildThemeLibraryExportBundleEntries keeps duplicate theme names from colliding", () => {
  const entries = buildThemeLibraryExportBundleEntries([
    createThemeDefinition({ id: "theme-a", name: "Shared Theme" }),
    createThemeDefinition({ id: "theme-b", name: "Shared Theme" }),
  ]);

  const themeEntries = entries
    .map((entry) => entry.fileName)
    .filter((fileName) => fileName.startsWith("themes/"));

  assert.equal(new Set(themeEntries).size, themeEntries.length);
});
