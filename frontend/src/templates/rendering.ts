import type { CSSProperties } from "react";
import type { ThemeColors } from "./types";

export const REFERENCE_CANVAS = {
  width: 3840,
  height: 2160,
} as const;

export type TemplateSurfaceStyle = "standard" | "glass" | "glass-strong";
export type TemplateSurfaceShadowStyle = "near" | "middle" | "distance";
export type TemplateBorderStyle = "solid" | "gradient" | "glass";

export function resolveTemplateSurfaceStyle(
  value: string | undefined,
): TemplateSurfaceStyle {
  return value === "glass" || value === "glass-strong" ? value : "standard";
}

export function resolveTemplateBorderStyle(
  value: string | undefined,
): TemplateBorderStyle {
  return value === "gradient" || value === "glass" ? value : "solid";
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
    return {
      ...baseStyle,
      borderWidth: `${scaledBorderWidth}px`,
      borderStyle: "solid",
      borderColor: "transparent",
      borderImageSource: `linear-gradient(135deg, ${borderColor}, ${borderColorSecondary ?? theme.textSecondary})`,
      borderImageSlice: 1,
      boxShadow: `0 ${Math.round(width * 0.015)}px ${Math.round(width * 0.04)}px ${colorWithAlpha(theme.background, 0.28)}`,
    };
  }

  if (borderStyle === "glass") {
    return {
      ...baseStyle,
      borderWidth: `${scaledBorderWidth}px`,
      borderStyle: "solid",
      borderColor: colorWithAlpha(theme.textPrimary, 0.28),
      boxShadow: `inset 0 1px 0 ${colorWithAlpha(theme.textPrimary, 0.22)}, 0 ${Math.round(width * 0.015)}px ${Math.round(width * 0.04)}px ${colorWithAlpha(theme.background, 0.32)}`,
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

  const isStrongGlass = surfaceStyle === "glass-strong";
  const shadowMetrics =
    shadowStyle === "near"
      ? { offsetY: 8, blur: 24, alpha: isStrongGlass ? 0.24 : 0.18 }
      : shadowStyle === "distance"
        ? { offsetY: 22, blur: 64, alpha: isStrongGlass ? 0.38 : 0.28 }
        : { offsetY: 14, blur: 40, alpha: isStrongGlass ? 0.34 : 0.22 };

  return {
    background: isStrongGlass
      ? `linear-gradient(145deg, ${colorWithAlpha(theme.surface, 0.74)}, ${colorWithAlpha(theme.background, 0.56)})`
      : `linear-gradient(145deg, ${colorWithAlpha(theme.surface, 0.58)}, ${colorWithAlpha(theme.background, 0.34)})`,
    border: `1px solid ${colorWithAlpha(theme.textPrimary, isStrongGlass ? 0.24 : 0.16)}`,
    backdropFilter: `blur(${isStrongGlass ? Math.round(28 * scale) : Math.round(18 * scale)}px) saturate(${isStrongGlass ? 165 : 140}%)`,
    boxShadow: `0 ${Math.round(shadowMetrics.offsetY * scale)}px ${Math.round(shadowMetrics.blur * scale)}px ${colorWithAlpha(theme.background, shadowMetrics.alpha)}`,
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
  const glassLine = `linear-gradient(90deg, ${colorWithAlpha(theme.textPrimary, 0)}, ${colorWithAlpha(theme.textPrimary, 0.22)} 24%, ${colorWithAlpha(borderColor, 0.68)} 50%, ${colorWithAlpha(theme.textPrimary, 0.22)} 76%, ${colorWithAlpha(theme.textPrimary, 0)})`;

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
        : borderStyle === "glass"
          ? glassLine
          : solidLine,
    boxShadow:
      borderStyle === "glass"
        ? `0 0 ${Math.round(18 * scale)}px ${colorWithAlpha(borderColor, 0.18)}`
        : undefined,
  };
}
