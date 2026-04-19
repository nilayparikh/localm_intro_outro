import type {
  ThemeColors,
  ThemeDefinition,
  ThemeGradientLayer,
  ThemeGradientStop,
} from "../templates/types";

export const DEFAULT_THEME_ID = "dark";

export const BUILT_IN_RENDER_THEMES: Record<string, ThemeColors> = {
  dark: {
    background: "#0f0f0f",
    surface: "#1a1a1a",
    textPrimary: "#ffffff",
    textSecondary: "#a0a0a0",
    accent: "#3b82f6",
    borderColor: "#3b82f6",
    gradientStart: "#0f0f0f",
    gradientMid: "#1a1a2e",
    gradientEnd: "#16213e",
  },
  light: {
    background: "#ffffff",
    surface: "#f5f5f5",
    textPrimary: "#1a1a1a",
    textSecondary: "#666666",
    accent: "#2563eb",
    borderColor: "#2563eb",
    gradientStart: "#ffffff",
    gradientMid: "#f0f4ff",
    gradientEnd: "#e0e7ff",
  },
  dracula: {
    background: "#282a36",
    surface: "#44475a",
    textPrimary: "#f8f8f2",
    textSecondary: "#6272a4",
    accent: "#bd93f9",
    borderColor: "#bd93f9",
    gradientStart: "#282a36",
    gradientMid: "#2d2f3f",
    gradientEnd: "#343746",
  },
  nord: {
    background: "#2e3440",
    surface: "#3b4252",
    textPrimary: "#eceff4",
    textSecondary: "#d8dee9",
    accent: "#88c0d0",
    borderColor: "#88c0d0",
    gradientStart: "#2e3440",
    gradientMid: "#333a47",
    gradientEnd: "#3b4252",
  },
  one_dark: {
    background: "#282c34",
    surface: "#21252b",
    textPrimary: "#abb2bf",
    textSecondary: "#5c6370",
    accent: "#61afef",
    borderColor: "#61afef",
    gradientStart: "#282c34",
    gradientMid: "#2c313a",
    gradientEnd: "#333842",
  },
  monokai: {
    background: "#272822",
    surface: "#3e3d32",
    textPrimary: "#f8f8f2",
    textSecondary: "#75715e",
    accent: "#a6e22e",
    borderColor: "#a6e22e",
    gradientStart: "#272822",
    gradientMid: "#2d2e27",
    gradientEnd: "#383930",
  },
  solarized_dark: {
    background: "#002b36",
    surface: "#073642",
    textPrimary: "#839496",
    textSecondary: "#586e75",
    accent: "#268bd2",
    borderColor: "#268bd2",
    gradientStart: "#002b36",
    gradientMid: "#003240",
    gradientEnd: "#073642",
  },
  gruvbox: {
    background: "#282828",
    surface: "#3c3836",
    textPrimary: "#ebdbb2",
    textSecondary: "#a89984",
    accent: "#fabd2f",
    borderColor: "#fabd2f",
    gradientStart: "#282828",
    gradientMid: "#302e2b",
    gradientEnd: "#3c3836",
  },
  tokyo_night: {
    background: "#1a1b26",
    surface: "#24283b",
    textPrimary: "#c0caf5",
    textSecondary: "#565f89",
    accent: "#7aa2f7",
    borderColor: "#7aa2f7",
    gradientStart: "#1a1b26",
    gradientMid: "#1e2030",
    gradientEnd: "#24283b",
  },
  github_dark: {
    background: "#0d1117",
    surface: "#161b22",
    textPrimary: "#c9d1d9",
    textSecondary: "#8b949e",
    accent: "#58a6ff",
    borderColor: "#58a6ff",
    gradientStart: "#0d1117",
    gradientMid: "#111820",
    gradientEnd: "#161b22",
  },
  catppuccin: {
    background: "#1e1e2e",
    surface: "#313244",
    textPrimary: "#cdd6f4",
    textSecondary: "#a6adc8",
    accent: "#cba6f7",
    borderColor: "#cba6f7",
    gradientStart: "#1e1e2e",
    gradientMid: "#262637",
    gradientEnd: "#313244",
  },
  "localm-core": {
    background: "#050505",
    surface: "#111111",
    textPrimary: "#e0e0e0",
    textSecondary: "#888888",
    accent: "#00ff94",
    borderColor: "#00ff94",
    gradientStart: "#050505",
    gradientMid: "#0a0f0a",
    gradientEnd: "#0f1a10",
  },
  "localm-assist": {
    background: "#080500",
    surface: "#151005",
    textPrimary: "#fff8e1",
    textSecondary: "#b8a050",
    accent: "#ffb800",
    borderColor: "#ffb800",
    gradientStart: "#080500",
    gradientMid: "#100a00",
    gradientEnd: "#181005",
  },
  "localm-research": {
    background: "#050505",
    surface: "#110f18",
    textPrimary: "#e8e0ff",
    textSecondary: "#9080b0",
    accent: "#8b5cf6",
    borderColor: "#8b5cf6",
    gradientStart: "#050505",
    gradientMid: "#0a0810",
    gradientEnd: "#110f18",
  },
  "localm-call": {
    background: "#02040a",
    surface: "#0a1020",
    textPrimary: "#e0f0ff",
    textSecondary: "#6090c0",
    accent: "#3b82f6",
    borderColor: "#3b82f6",
    gradientStart: "#02040a",
    gradientMid: "#060a15",
    gradientEnd: "#0a1020",
  },
  "localm-sdk": {
    background: "#050505",
    surface: "#111111",
    textPrimary: "#f0f0f0",
    textSecondary: "#888888",
    accent: "#00ff94",
    borderColor: "#00ff94",
    gradientStart: "#050505",
    gradientMid: "#0a0a0a",
    gradientEnd: "#101010",
  },
};

function formatThemeName(themeId: string): string {
  return themeId
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function createStop(
  id: string,
  color: string,
  position: number,
): ThemeGradientStop {
  return { id, color, position };
}

function cloneLayer(layer: ThemeGradientLayer): ThemeGradientLayer {
  return {
    ...layer,
    stops: layer.stops.map((stop) => ({ ...stop })),
  };
}

function buildDefaultLayer(
  themeId: string,
  theme: ThemeColors,
): ThemeGradientLayer {
  return {
    id: `${themeId}-layer-1`,
    type: "linear",
    angle: 135,
    centerX: 50,
    centerY: 50,
    radius: 80,
    opacity: 100,
    stops: [
      createStop(`${themeId}-stop-1`, theme.gradientStart, 0),
      createStop(`${themeId}-stop-2`, theme.gradientMid, 50),
      createStop(`${themeId}-stop-3`, theme.gradientEnd, 100),
    ],
  };
}

function createId(prefix: string): string {
  const safeRandom =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${safeRandom}`;
}

function hexToRgba(color: string, opacity: number): string {
  const normalized = color.replace("#", "").trim();
  const alpha = Math.min(1, Math.max(0, opacity / 100));

  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(normalized)) {
    return color;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((segment) => segment + segment)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
}

function buildGradientStopsCss(layer: ThemeGradientLayer): string {
  return layer.stops
    .map((stop) => `${hexToRgba(stop.color, layer.opacity)} ${stop.position}%`)
    .join(", ");
}

function buildGradientLayerCss(layer: ThemeGradientLayer): string {
  const stops = buildGradientStopsCss(layer);

  if (layer.type === "radial") {
    return `radial-gradient(circle ${layer.radius}% at ${layer.centerX}% ${layer.centerY}%, ${stops})`;
  }

  return `linear-gradient(${layer.angle}deg, ${stops})`;
}

export const BUILT_IN_THEME_DEFINITIONS: ThemeDefinition[] = Object.entries(
  BUILT_IN_RENDER_THEMES,
).map(([themeId, theme]) => ({
  id: themeId,
  name: formatThemeName(themeId),
  description: `${formatThemeName(themeId)} built-in theme`,
  background: theme.background,
  surface: theme.surface,
  textPrimary: theme.textPrimary,
  textSecondary: theme.textSecondary,
  accent: theme.accent,
  borderColor: theme.borderColor ?? theme.accent,
  gradientStart: theme.gradientStart,
  gradientMid: theme.gradientMid,
  gradientEnd: theme.gradientEnd,
  backgroundLayers: [buildDefaultLayer(themeId, theme)],
  updatedAt: 0,
}));

export function createThemeDefinition(
  overrides: Partial<ThemeDefinition> = {},
): ThemeDefinition {
  const defaultTheme =
    BUILT_IN_THEME_DEFINITIONS.find((theme) => theme.id === DEFAULT_THEME_ID) ??
    BUILT_IN_THEME_DEFINITIONS[0]!;

  return {
    ...defaultTheme,
    id: overrides.id ?? createId("theme"),
    name: overrides.name ?? "New Theme",
    description: overrides.description ?? "",
    updatedAt: overrides.updatedAt ?? Date.now(),
    ...overrides,
    backgroundLayers: overrides.backgroundLayers
      ? overrides.backgroundLayers.map((layer) => cloneLayer(layer))
      : defaultTheme.backgroundLayers.map((layer) => cloneLayer(layer)),
  };
}

export function resolveThemeDefinition(
  themes: ThemeDefinition[],
  themeId: string,
): ThemeDefinition {
  return (
    themes.find((theme) => theme.id === themeId) ??
    themes.find((theme) => theme.id === DEFAULT_THEME_ID) ??
    BUILT_IN_THEME_DEFINITIONS.find((theme) => theme.id === DEFAULT_THEME_ID) ??
    themes[0] ??
    BUILT_IN_THEME_DEFINITIONS[0]!
  );
}

export function buildThemeBackground(theme: ThemeDefinition): string {
  if (theme.backgroundLayers.length === 0) {
    return theme.background;
  }

  return `${theme.backgroundLayers.map((layer) => buildGradientLayerCss(layer)).join(", ")}, ${theme.background}`;
}

export function toRenderableTheme(theme: ThemeDefinition): ThemeColors {
  const primaryLayer = theme.backgroundLayers[0];

  return {
    background: theme.background,
    surface: theme.surface,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    accent: theme.accent,
    borderColor: theme.borderColor,
    gradientStart: primaryLayer?.stops[0]?.color ?? theme.gradientStart,
    gradientMid:
      primaryLayer?.stops[Math.min(1, primaryLayer.stops.length - 1)]?.color ??
      theme.gradientMid,
    gradientEnd:
      primaryLayer?.stops[primaryLayer.stops.length - 1]?.color ??
      theme.gradientEnd,
    backgroundImage: buildThemeBackground(theme),
  };
}

export function buildThemeExportData(theme: ThemeDefinition): string {
  return JSON.stringify(theme, null, 2);
}
