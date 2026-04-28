import type { CSSProperties } from "react";
import type { ThemeColors } from "./types";

export const REFERENCE_CANVAS = {
  width: 3840,
  height: 2160,
} as const;

export const GLASS_INTENSITY_STEPS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

export type GlassIntensityStep = (typeof GLASS_INTENSITY_STEPS)[number];
export type TemplateGlassStyle = `glass-${GlassIntensityStep}`;
export type TemplateSurfaceStyle = "standard" | TemplateGlassStyle;
export type TemplateSurfaceShadowStyle = "near" | "middle" | "distance";
export type TemplateBorderStyle = "solid" | "gradient" | TemplateGlassStyle;

export const DEFAULT_GLASS_STYLE: TemplateGlassStyle = "glass-40";
export const STRONG_GLASS_STYLE: TemplateGlassStyle = "glass-100";

const GLASS_STYLE_PATTERN = /^glass-(10|20|30|40|50|60|70|80|90|100)$/;

export function buildTemplateGlassStyle(
  intensity: GlassIntensityStep,
): TemplateGlassStyle {
  return `glass-${intensity}` as TemplateGlassStyle;
}

export function resolveTemplateGlassStyle(
  value: string | undefined,
): TemplateGlassStyle | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue === "glass") {
    return DEFAULT_GLASS_STYLE;
  }

  if (normalizedValue === "glass-strong") {
    return STRONG_GLASS_STYLE;
  }

  const match = normalizedValue.match(GLASS_STYLE_PATTERN);

  if (!match) {
    return null;
  }

  const intensityValue = match[1];

  if (!intensityValue) {
    return null;
  }

  return buildTemplateGlassStyle(
    Number.parseInt(intensityValue, 10) as GlassIntensityStep,
  );
}

export function getTemplateGlassIntensity(
  value: TemplateGlassStyle | string | undefined,
): GlassIntensityStep | null {
  const resolvedStyle = resolveTemplateGlassStyle(value);

  if (!resolvedStyle) {
    return null;
  }

  return Number.parseInt(resolvedStyle.slice(6), 10) as GlassIntensityStep;
}

export function interpolateGlassValue(
  intensity: GlassIntensityStep,
  minimum: number,
  maximum: number,
): number {
  if (minimum === maximum) {
    return minimum;
  }

  const factor = (intensity - 10) / 90;

  return minimum + (maximum - minimum) * factor;
}

export function resolveTemplateSurfaceStyle(
  value: string | undefined,
): TemplateSurfaceStyle {
  return resolveTemplateGlassStyle(value) ?? "standard";
}

export function resolveTemplateBorderStyle(
  value: string | undefined,
): TemplateBorderStyle {
  if (value === "gradient") {
    return "gradient";
  }

  return resolveTemplateGlassStyle(value) ?? "solid";
}

export function resolveTemplateSurfaceShadowStyle(
  value: string | undefined,
): TemplateSurfaceShadowStyle {
  if (value === "near" || value === "distance") {
    return value;
  }

  return "middle";
}

export type GridPatternName =
  | "dots"
  | "grid"
  | "diagonal"
  | "cross"
  | "hexagon"
  | "circuit";

interface GridPatternBaseMetrics {
  tileWidth: number;
  tileHeight: number;
  dotRadius?: number;
  strokeWidth?: number;
  pointX?: number;
  pointY?: number;
}

export interface GridPatternMetrics extends GridPatternBaseMetrics {}

const GRID_PATTERN_BASE_METRICS: Record<
  GridPatternName,
  GridPatternBaseMetrics
> = {
  dots: {
    tileWidth: 112.5,
    tileHeight: 112.5,
    pointX: 56.25,
    pointY: 56.25,
    dotRadius: 7.5,
  },
  grid: {
    tileWidth: 150,
    tileHeight: 150,
    strokeWidth: 3.75,
  },
  diagonal: {
    tileWidth: 75,
    tileHeight: 75,
    strokeWidth: 3.75,
  },
  cross: {
    tileWidth: 112.5,
    tileHeight: 112.5,
    pointX: 56.25,
    pointY: 56.25,
    strokeWidth: 1.875,
  },
  hexagon: {
    tileWidth: 210,
    tileHeight: 375,
    strokeWidth: 3.75,
  },
  circuit: {
    tileWidth: 225,
    tileHeight: 225,
    strokeWidth: 3.75,
    pointX: 37.5,
    pointY: 37.5,
    dotRadius: 11.25,
  },
};

function scaleFromReference(canvasWidth: number, value: number): number {
  return value * (canvasWidth / REFERENCE_CANVAS.width);
}

function roundMetric(value: number): number {
  return Math.max(0, Math.round(value));
}

function roundStroke(value: number | undefined): number {
  if (!value) {
    return 0;
  }

  return Math.max(0.5, Number(value.toFixed(2)));
}

export function getGridPatternMetrics(
  pattern: GridPatternName,
  canvasWidth: number,
): GridPatternMetrics {
  const baseMetrics = GRID_PATTERN_BASE_METRICS[pattern];

  return {
    tileWidth: roundMetric(
      scaleFromReference(canvasWidth, baseMetrics.tileWidth),
    ),
    tileHeight: roundMetric(
      scaleFromReference(canvasWidth, baseMetrics.tileHeight),
    ),
    pointX:
      baseMetrics.pointX === undefined
        ? undefined
        : roundMetric(scaleFromReference(canvasWidth, baseMetrics.pointX)),
    pointY:
      baseMetrics.pointY === undefined
        ? undefined
        : roundMetric(scaleFromReference(canvasWidth, baseMetrics.pointY)),
    dotRadius:
      baseMetrics.dotRadius === undefined
        ? undefined
        : roundMetric(scaleFromReference(canvasWidth, baseMetrics.dotRadius)),
    strokeWidth: roundStroke(
      baseMetrics.strokeWidth === undefined
        ? undefined
        : scaleFromReference(canvasWidth, baseMetrics.strokeWidth),
    ),
  };
}

export function getScaledBorderWidth(
  canvasWidth: number,
  referenceBorderWidth: number,
): number {
  if (referenceBorderWidth <= 0) {
    return 0;
  }

  return Math.max(
    1,
    roundMetric(scaleFromReference(canvasWidth, referenceBorderWidth)),
  );
}

function normalizeHexColor(color: string): string | null {
  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(normalized)) {
    return null;
  }

  return normalized.length === 3
    ? normalized
        .split("")
        .map((segment) => segment + segment)
        .join("")
    : normalized;
}

export function colorWithAlpha(color: string, alpha: number): string {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    return color;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const clampedAlpha = Math.min(1, Math.max(0, alpha));

  return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha.toFixed(3)})`;
}

export function opaqueColor(color: string): string {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    return color;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgb(${red}, ${green}, ${blue})`;
}

export function buildTemplateFrameStyle({
  width,
  height,
  fontFamily,
  transparentBackground = false,
  theme,
  borderWidth,
  borderColor,
  borderColorSecondary,
  borderStyle = "solid",
}: {
  width: number;
  height: number;
  fontFamily: string;
  transparentBackground?: boolean;
  theme: ThemeColors;
  borderWidth: number;
  borderColor: string;
  borderColorSecondary?: string;
  borderStyle?: TemplateBorderStyle;
}): CSSProperties {
  const scaledBorderWidth = getScaledBorderWidth(width, borderWidth);
  const baseStyle: CSSProperties = {
    width,
    height,
    boxSizing: "border-box",
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    fontFamily,
    background: transparentBackground
      ? "none"
      : (theme.backgroundImage ??
        `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`),
  };

  if (scaledBorderWidth <= 0) {
    return baseStyle;
  }

  if (borderStyle === "gradient") {
    const frameBackground = transparentBackground
      ? "transparent"
      : (theme.backgroundImage ??
        `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`);
    const resolvedSecondaryBorderColor =
      borderColorSecondary ?? theme.borderColor ?? theme.accent;

    return {
      ...baseStyle,
      borderWidth: `${scaledBorderWidth}px`,
      borderStyle: "solid",
      borderColor: "transparent",
      backgroundImage: `${frameBackground}, linear-gradient(135deg, ${borderColor}, ${resolvedSecondaryBorderColor})`,
      backgroundOrigin: "border-box",
      backgroundClip: "padding-box, border-box",
      boxShadow: `0 ${Math.round(width * 0.015)}px ${Math.round(width * 0.04)}px ${colorWithAlpha(theme.background, 0.28)}`,
    };
  }

  const glassIntensity = getTemplateGlassIntensity(borderStyle);

  if (glassIntensity !== null) {
    return {
      ...baseStyle,
      borderWidth: `${scaledBorderWidth}px`,
      borderStyle: "solid",
      borderColor: colorWithAlpha(
        theme.textPrimary,
        interpolateGlassValue(glassIntensity, 0.16, 0.34),
      ),
      boxShadow: `inset 0 1px 0 ${colorWithAlpha(theme.textPrimary, interpolateGlassValue(glassIntensity, 0.1, 0.22))}, 0 ${Math.round(width * 0.015)}px ${Math.round(width * 0.04)}px ${colorWithAlpha(theme.background, interpolateGlassValue(glassIntensity, 0.2, 0.32))}`,
    };
  }

  return {
    ...baseStyle,
    borderWidth: `${scaledBorderWidth}px`,
    borderStyle: "solid",
    borderColor,
  };
}

export function buildTemplatePanelStyle({
  surfaceStyle,
  theme,
  scale,
  shadowStyle = "middle",
}: {
  surfaceStyle: TemplateSurfaceStyle;
  theme: ThemeColors;
  scale: number;
  shadowStyle?: TemplateSurfaceShadowStyle;
}): CSSProperties {
  if (surfaceStyle === "standard") {
    return {};
  }

  const glassIntensity = getTemplateGlassIntensity(surfaceStyle);

  if (glassIntensity === null) {
    return {};
  }

  const shadowMetrics =
    shadowStyle === "near"
      ? { offsetY: 8, blur: 24, minAlpha: 0.12, maxAlpha: 0.24 }
      : shadowStyle === "distance"
        ? { offsetY: 22, blur: 64, minAlpha: 0.18, maxAlpha: 0.38 }
        : { offsetY: 14, blur: 40, minAlpha: 0.14, maxAlpha: 0.34 };

  return {
    background: `linear-gradient(145deg, ${colorWithAlpha(theme.surface, interpolateGlassValue(glassIntensity, 0.46, 0.74))}, ${colorWithAlpha(theme.background, interpolateGlassValue(glassIntensity, 0.22, 0.56))})`,
    border: `1px solid ${colorWithAlpha(theme.textPrimary, interpolateGlassValue(glassIntensity, 0.12, 0.24))}`,
    backdropFilter: `blur(${Math.round(interpolateGlassValue(glassIntensity, 12, 28) * scale)}px) saturate(${Math.round(interpolateGlassValue(glassIntensity, 132, 165))}%)`,
    boxShadow: `0 ${Math.round(shadowMetrics.offsetY * scale)}px ${Math.round(shadowMetrics.blur * scale)}px ${colorWithAlpha(theme.background, interpolateGlassValue(glassIntensity, shadowMetrics.minAlpha, shadowMetrics.maxAlpha))}`,
  };
}

export function buildTemplateSeparatorStyle({
  theme,
  borderColor,
  borderColorSecondary,
  borderStyle,
  scale,
}: {
  theme: ThemeColors;
  borderColor: string;
  borderColorSecondary?: string;
  borderStyle: TemplateBorderStyle;
  scale: number;
}): CSSProperties {
  const resolvedBorderColorSecondary =
    borderColorSecondary ?? theme.textSecondary;
  const solidLine = `linear-gradient(90deg, ${colorWithAlpha(borderColor, 0)}, ${opaqueColor(borderColor)} 50%, ${colorWithAlpha(borderColor, 0)})`;
  const gradientLine = borderColorSecondary
    ? `linear-gradient(90deg, ${colorWithAlpha(borderColor, 0)}, ${opaqueColor(borderColor)} 32%, ${opaqueColor(resolvedBorderColorSecondary)} 68%, ${colorWithAlpha(borderColor, 0)})`
    : `linear-gradient(90deg, ${colorWithAlpha(theme.accent, 0)}, ${opaqueColor(theme.accent)} 24%, ${opaqueColor(borderColor)} 50%, ${opaqueColor(theme.textSecondary)} 76%, ${colorWithAlpha(theme.accent, 0)})`;
  const glassIntensity = getTemplateGlassIntensity(borderStyle);
  const glassLine =
    glassIntensity === null
      ? null
      : `linear-gradient(90deg, ${colorWithAlpha(theme.textPrimary, 0)}, ${colorWithAlpha(theme.textPrimary, interpolateGlassValue(glassIntensity, 0.12, 0.24))} 24%, ${colorWithAlpha(borderColor, interpolateGlassValue(glassIntensity, 0.44, 0.68))} 50%, ${colorWithAlpha(theme.textPrimary, interpolateGlassValue(glassIntensity, 0.12, 0.24))} 76%, ${colorWithAlpha(theme.textPrimary, 0)})`;

  return {
    width: `${Math.round(280 * scale)}px`,
    maxWidth: "68%",
    height: `${Math.max(2, Math.round(2 * scale))}px`,
    marginTop: `${Math.round(18 * scale)}px`,
    marginBottom: `${Math.round(18 * scale)}px`,
    borderRadius: `${Math.round(999 * scale)}px`,
    background:
      borderStyle === "gradient"
        ? gradientLine
        : glassLine
          ? glassLine
          : solidLine,
    boxShadow: glassLine
      ? `0 0 ${Math.round(18 * scale)}px ${colorWithAlpha(borderColor, interpolateGlassValue(glassIntensity as GlassIntensityStep, 0.08, 0.18))}`
      : undefined,
  };
}
