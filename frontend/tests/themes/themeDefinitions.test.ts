import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_THEME_DEFINITIONS,
  buildThemeBackground,
  buildThemeExportData,
  buildThemeReactPageSource,
  createThemeDefinition,
  resolveThemeDefinition,
  toRenderableTheme,
} from "../../src/themes/themeDefinitions";

test("built-in themes expose editable gradient layers and border colors", () => {
  const darkTheme = BUILT_IN_THEME_DEFINITIONS.find(
    (theme) => theme.id === "dark",
  );

  assert.ok(darkTheme);
  assert.equal(darkTheme.borderColor, "#3b82f6");
  assert.equal(darkTheme.backgroundLayers.length, 1);
  assert.equal(darkTheme.backgroundLayers[0]?.stops.length, 3);
});

test("createThemeDefinition starts with a complete editable theme draft", () => {
  const theme = createThemeDefinition({ name: "Ocean Glass" });

  assert.ok(theme.id.length > 0);
  assert.equal(theme.name, "Ocean Glass");
  assert.equal(theme.backgroundLayers.length, 1);
  assert.equal(theme.backgroundLayers[0]?.type, "linear");
  assert.equal(theme.backgroundLayers[0]?.stops[0]?.position, 0);
  assert.equal(theme.backgroundLayers[0]?.stops[2]?.position, 100);
});

test("resolveThemeDefinition falls back to the default seeded theme", () => {
  const resolved = resolveThemeDefinition(
    BUILT_IN_THEME_DEFINITIONS,
    "missing-theme-id",
  );

  assert.equal(resolved.id, "dark");
});

test("renderable themes use generated background css and preserve border defaults", () => {
  const theme = createThemeDefinition({
    id: "custom-theme",
    name: "Custom Theme",
    background: "#010203",
    borderColor: "#f59e0b",
    backgroundLayers: [
      {
        id: "layer-1",
        type: "linear",
        angle: 45,
        centerX: 50,
        centerY: 50,
        radius: 80,
        opacity: 100,
        stops: [
          { id: "stop-1", color: "#111111", position: 0 },
          { id: "stop-2", color: "#222222", position: 40 },
          { id: "stop-3", color: "#333333", position: 100 },
        ],
      },
      {
        id: "layer-2",
        type: "radial",
        angle: 0,
        centerX: 20,
        centerY: 30,
        radius: 60,
        opacity: 55,
        stops: [
          { id: "stop-4", color: "#abcdef", position: 0 },
          { id: "stop-5", color: "#654321", position: 100 },
        ],
      },
    ],
  });

  const renderableTheme = toRenderableTheme(theme);
  const backgroundCss = buildThemeBackground(theme);

  assert.equal(renderableTheme.borderColor, "#f59e0b");
  assert.equal(renderableTheme.gradientStart, "#111111");
  assert.equal(renderableTheme.gradientMid, "#222222");
  assert.equal(renderableTheme.gradientEnd, "#333333");
  assert.equal(renderableTheme.backgroundImage, backgroundCss);
  assert.match(backgroundCss, /linear-gradient\(45deg/);
  assert.match(backgroundCss, /radial-gradient\(circle 60% at 20% 30%/);
});

test("theme export includes full dynamic theme configuration", () => {
  const theme = createThemeDefinition({ id: "exportable", name: "Exportable" });
  const exported = JSON.parse(buildThemeExportData(theme));

  assert.equal(exported.id, "exportable");
  assert.equal(exported.name, "Exportable");
  assert.ok(Array.isArray(exported.backgroundLayers));
  assert.equal(exported.backgroundLayers.length, 1);
});

test("theme export can generate a React page that preserves the background algorithm", () => {
  const theme = createThemeDefinition({
    id: "exportable",
    name: "Exportable",
    backgroundLayers: [
      {
        id: "layer-1",
        type: "linear",
        angle: 120,
        centerX: 50,
        centerY: 50,
        radius: 80,
        opacity: 90,
        stops: [
          { id: "stop-1", color: "#111111", position: 0 },
          { id: "stop-2", color: "#222222", position: 50 },
          { id: "stop-3", color: "#333333", position: 100 },
        ],
      },
    ],
  });

  const reactPageSource = buildThemeReactPageSource(theme);

  assert.match(reactPageSource, /function buildThemeBackground/);
  assert.match(reactPageSource, /const themeDefinition = /);
  assert.match(reactPageSource, /Exportable/);
  assert.match(reactPageSource, /backgroundLayers/);
  assert.match(reactPageSource, /linear-gradient/);
});
