import test from "node:test";
import assert from "node:assert/strict";
import { BUILT_IN_THEME_DEFINITIONS } from "../../src/themes/themeDefinitions";
import {
  mergeStoredThemesWithBuiltIns,
  prepareThemeForSave,
} from "../../src/persistence/themePersistence";

test("mergeStoredThemesWithBuiltIns lets stored themes override built-in themes with the same id", () => {
  const merged = mergeStoredThemesWithBuiltIns([
    {
      ...BUILT_IN_THEME_DEFINITIONS[0]!,
      name: "Dark Duplicate",
      updatedAt: 123,
    },
  ]);

  const darkTheme = merged.find(
    (theme) => theme.id === BUILT_IN_THEME_DEFINITIONS[0]!.id,
  );

  assert.equal(darkTheme?.name, "Dark Duplicate");
  assert.equal(merged.length, BUILT_IN_THEME_DEFINITIONS.length);
});

test("prepareThemeForSave creates a persisted theme shape from partial edits", () => {
  const savedTheme = prepareThemeForSave(
    {
      name: "Dark Duplicate",
      description: "Stored remotely",
      accent: "#00ff94",
    },
    BUILT_IN_THEME_DEFINITIONS,
  );

  assert.equal(savedTheme.name, "Dark Duplicate");
  assert.equal(savedTheme.description, "Stored remotely");
  assert.equal(savedTheme.accent, "#00ff94");
  assert.ok(savedTheme.updatedAt > 0);
});
