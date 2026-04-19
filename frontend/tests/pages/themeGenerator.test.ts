import test from "node:test";
import assert from "node:assert/strict";
import { BUILT_IN_THEME_DEFINITIONS } from "../../src/themes/themeDefinitions";
import {
  buildThemeEditorState,
  buildThemeExportFileName,
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
