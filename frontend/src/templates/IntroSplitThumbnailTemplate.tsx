import type { TemplateProps } from "./types";
import { textSizeToMultiplier } from "./index";
import {
  buildTemplateFrameStyle,
  buildTemplatePanelStyle,
  getGridPatternMetrics,
  resolveTemplateBorderStyle,
  resolveTemplateSurfaceShadowStyle,
  resolveTemplateSurfaceStyle,
  type GridPatternName,
} from "./rendering";
import { ThumbnailCapsules } from "./ThumbnailCapsules";
import { ThumbnailFooter, resolveFooterSize } from "./ThumbnailFooter";
import {
  buildSplitDividerPolylinePoints,
  resolveSplitPartitionPoints,
  resolveSplitPolygons,
} from "../pages/thumbnailSplitPartition";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveTitleSide(value: string | undefined): "left" | "right" {
  return value === "right" ? "right" : "left";
}

type SplitTypeCapsule = "bite" | "course" | "mono" | "debug";

function resolveSplitTypeCapsuleValue(
  value: string | undefined,
): SplitTypeCapsule {
  if (value === "course" || value === "mono" || value === "debug") {
    return value;
  }

  return "bite";
}

function resolveSplitTypeCapsuleLabel(value: SplitTypeCapsule): string {
  if (value === "course") {
    return "COURSE";
  }

  if (value === "mono") {
    return "MONO";
  }

  if (value === "debug") {
    return "DEBUG MODE";
  }

  return "BITE";
}

function isEnabled(value: string | undefined): boolean {
  return value === "true";
}

function buildSplitForegroundMaskStyles(values: TemplateProps["values"]) {
  const maskLayers: string[] = [];

  if (isEnabled(values["split_foreground_blend_left"])) {
    maskLayers.push(
      "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
    );
  }

  if (isEnabled(values["split_foreground_blend_right"])) {
    maskLayers.push(
      "linear-gradient(to left, transparent 0%, black 10%, black 100%)",
    );
  }

  if (isEnabled(values["split_foreground_blend_top"])) {
    maskLayers.push(
      "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)",
    );
  }

  if (isEnabled(values["split_foreground_blend_bottom"])) {
    maskLayers.push(
      "linear-gradient(to top, transparent 0%, black 10%, black 100%)",
    );
  }

  if (maskLayers.length === 0) {
    return {};
  }

  return {
    maskImage: maskLayers.join(", "),
    WebkitMaskImage: maskLayers.join(", "),
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    ...(maskLayers.length > 1
      ? {
          maskComposite: Array.from(
            { length: maskLayers.length - 1 },
            () => "intersect",
          ).join(", "),
          WebkitMaskComposite: Array.from(
            { length: maskLayers.length - 1 },
            () => "source-in",
          ).join(", "),
        }
      : {}),
  };
}

function SplitTypeCapsuleIcon({
  type,
  size,
  color,
}: {
  type: SplitTypeCapsule;
  size: number;
  color: string;
}) {
  if (type === "course") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M4.5 7.2L12 4L19.5 7.2L12 10.4L4.5 7.2Z"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M7 11V16.8L12 19L17 16.8V11"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "mono") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <rect
          x="4.8"
          y="5"
          width="14.4"
          height="14"
          rx="2.2"
          stroke={color}
          strokeWidth="1.8"
        />
        <path
          d="M8.2 10.2H15.8"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8.2 13.8H12.8"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "debug") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <rect
          x="7"
          y="8"
          width="10"
          height="8.5"
          rx="2"
          stroke={color}
          strokeWidth="1.8"
        />
        <path
          d="M9.5 8V6.3M14.5 8V6.3"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="10.3" cy="12.2" r="1" fill={color} />
        <circle cx="13.7" cy="12.2" r="1" fill={color} />
        <path
          d="M3.8 11H6.2M17.8 11H20.2M3.8 14H6.2M17.8 14H20.2"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5.5 7.5L12 4.2L18.5 7.5V16.5L12 19.8L5.5 16.5V7.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12H15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type CapsuleSizePreset = "small" | "medium" | "large";

const SPLIT_TYPE_CAPSULE_SIZING = {
  small: {
    insetX: 40,
    insetY: 36,
    groupGap: 12,
    paddingY: 10,
    paddingX: 18,
    textSize: 18,
    marginBottom: 20,
  },
  medium: {
    insetX: 44,
    insetY: 40,
    groupGap: 14,
    paddingY: 12,
    paddingX: 22,
    textSize: 22,
    marginBottom: 22,
  },
  large: {
    insetX: 48,
    insetY: 44,
    groupGap: 16,
    paddingY: 14,
    paddingX: 26,
    textSize: 26,
    marginBottom: 24,
  },
} as const;

function resolveCapsuleSizePreset(
  value: string | undefined,
): CapsuleSizePreset {
  if (value === "medium" || value === "large") {
    return value;
  }

  return "small";
}

function GridPattern({
  pattern,
  color,
  width,
  height,
}: {
  pattern: string;
  color: string;
  width: number;
  height: number;
}) {
  const opacity = 0.22;
  const metrics = getGridPatternMetrics(pattern as GridPatternName, width);

  switch (pattern) {
    case "dots":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity }}
        >
          <defs>
            <pattern
              id="intro-split-dots"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={metrics.pointX}
                cy={metrics.pointY}
                r={metrics.dotRadius}
                fill={color}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-split-dots)" />
        </svg>
      );
    case "grid":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity }}
        >
          <defs>
            <pattern
              id="intro-split-grid"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${metrics.tileWidth} 0 L 0 0 0 ${metrics.tileHeight}`}
                fill="none"
                stroke={color}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-split-grid)" />
        </svg>
      );
    case "diagonal":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity }}
        >
          <defs>
            <pattern
              id="intro-split-diagonal"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M 0 ${metrics.tileHeight} L ${metrics.tileWidth} 0`}
                fill="none"
                stroke={color}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-split-diagonal)" />
        </svg>
      );
    case "cross":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity }}
        >
          <defs>
            <pattern
              id="intro-split-cross"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${metrics.pointX} 0 L ${metrics.pointX} ${metrics.tileHeight} M 0 ${metrics.pointY} L ${metrics.tileWidth} ${metrics.pointY}`}
                fill="none"
                stroke={color}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-split-cross)" />
        </svg>
      );
    case "hexagon":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity }}
        >
          <defs>
            <pattern
              id="intro-split-hexagon"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${Math.round(metrics.tileWidth / 2)} 0 L ${metrics.tileWidth} ${Math.round(metrics.tileHeight * 0.17)} ${metrics.tileWidth} ${Math.round(metrics.tileHeight * 0.5)} ${Math.round(metrics.tileWidth / 2)} ${Math.round(metrics.tileHeight * 0.67)} 0 ${Math.round(metrics.tileHeight * 0.5)} 0 ${Math.round(metrics.tileHeight * 0.17)}Z`}
                fill="none"
                stroke={color}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-split-hexagon)" />
        </svg>
      );
    case "circuit":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity }}
        >
          <defs>
            <pattern
              id="intro-split-circuit"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={metrics.pointX}
                cy={metrics.pointY}
                r={metrics.dotRadius}
                fill={color}
              />
              <path
                d={`M ${metrics.pointX} ${metrics.pointY} L ${Math.round(metrics.tileWidth * 0.83)} ${metrics.pointY} ${Math.round(metrics.tileWidth * 0.83)} ${Math.round(metrics.tileHeight * 0.83)}`}
                fill="none"
                stroke={color}
                strokeWidth={metrics.strokeWidth}
              />
              <circle
                cx={Math.round(metrics.tileWidth * 0.83)}
                cy={Math.round(metrics.tileHeight * 0.83)}
                r={metrics.dotRadius}
                fill={color}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-split-circuit)" />
        </svg>
      );
    default:
      return null;
  }
}

export function IntroSplitThumbnailTemplate({
  width,
  height,
  values,
  theme,
  fontFamily,
  primaryFontFamily,
  secondaryFontFamily,
  fontSize,
  socialRenderMode = "full",
  borderWidth,
  borderColor,
  transparentBackground = false,
  tutorialImageUrl,
  overlayImageUrl,
  overlayImageScale,
  overlayImageX,
  overlayImageY,
  splitBlendImageUrl,
  splitCornerIconUrls,
  splitCornerIconSize,
  copyrightText,
}: TemplateProps) {
  const scale = width / 1280;
  const typographyScale = Math.min(scale, 1.2);
  const primaryFont = primaryFontFamily ?? fontFamily ?? "'Outfit', sans-serif";
  const secondaryFont =
    secondaryFontFamily ?? fontFamily ?? "'Share Tech Mono', monospace";
  const titleSize = Math.round(
    fontSize *
      1.2 *
      typographyScale *
      textSizeToMultiplier(values["title_size"] ?? "lg"),
  );
  const title = values["title"]?.trim() || "AI Voice Cloning in 45 Seconds";
  const splitTypeCapsuleValue = resolveSplitTypeCapsuleValue(
    values["split_type_capsule"],
  );
  const splitTypeCapsuleLabel = resolveSplitTypeCapsuleLabel(
    splitTypeCapsuleValue,
  );
  const titleSide = resolveTitleSide(values["split_title_side"]);
  const splitForegroundScale =
    clamp(
      Number.parseFloat(values["split_foreground_scale"] ?? "108"),
      50,
      180,
    ) / 100;
  const splitForegroundX = clamp(
    Number.parseFloat(values["split_foreground_x"] ?? "0"),
    -24,
    24,
  );
  const splitForegroundY = clamp(
    Number.parseFloat(values["split_foreground_y"] ?? "0"),
    -24,
    24,
  );
  const splitOpacity =
    clamp(
      Number.parseFloat(values["split_background_opacity"] ?? "55"),
      0,
      100,
    ) / 100;
  const resolvedBackgroundScale =
    clamp(overlayImageScale ?? 100, 50, 180) / 100;
  const resolvedBackgroundX = clamp(overlayImageX ?? 0, -24, 24);
  const resolvedBackgroundY = clamp(overlayImageY ?? 0, -24, 24);
  const splitForegroundFit = splitForegroundScale < 1 ? "contain" : "cover";
  const splitTypeCapsuleSizing =
    SPLIT_TYPE_CAPSULE_SIZING[resolveCapsuleSizePreset(values["capsule_size"])];
  const resolvedSplitCornerIconSize = clamp(
    splitCornerIconSize ?? 100,
    50,
    180,
  );
  const bottomCornerIconUrls = (splitCornerIconUrls ?? []).filter((url) =>
    url?.trim(),
  );
  const bottomCornerSide = titleSide === "left" ? "right" : "left";
  const bottomCornerIconDimension = Math.max(
    24,
    Math.round(48 * scale * (resolvedSplitCornerIconSize / 100)),
  );
  const splitForegroundMaskStyles = buildSplitForegroundMaskStyles(values);

  const splitPartition = resolveSplitPartitionPoints(
    values["split_partition_points"] ?? "",
  );
  const splitPolygons = resolveSplitPolygons(splitPartition.points);
  const foregroundPolygon =
    titleSide === "left" ? splitPolygons.right : splitPolygons.left;
  const showGrid = values["show_grid"] !== "false";
  const gridPattern = values["grid_pattern"] ?? "dots";
  const surfaceStyle = resolveTemplateSurfaceStyle(values["surface_style"]);
  const surfaceShadow = resolveTemplateSurfaceShadowStyle(
    values["surface_shadow"],
  );
  const borderStyle = resolveTemplateBorderStyle(values["border_style"]);
  const borderColorSecondary =
    values["border_color_secondary"]?.trim() || undefined;
  const footerSize = resolveFooterSize(values["footer_size"]);
  const titlePanelStyle = buildTemplatePanelStyle({
    surfaceStyle,
    theme,
    scale,
    shadowStyle: surfaceShadow,
  });

  if (socialRenderMode === "only") {
    return (
      <div
        style={{
          width,
          height,
          position: "relative",
          overflow: "hidden",
          background: "transparent",
          fontFamily: primaryFont,
        }}
      >
        <ThumbnailFooter
          width={width}
          color={theme.textSecondary}
          fontSize={fontSize}
          footerFontFamily={primaryFont}
          size={footerSize}
          renderMode="only"
          text={copyrightText}
        />
      </div>
    );
  }

  return (
    <div
      style={buildTemplateFrameStyle({
        width,
        height,
        fontFamily: primaryFont,
        transparentBackground,
        theme,
        borderWidth,
        borderColor,
        borderColorSecondary,
        borderStyle,
      })}
    >
      {splitBlendImageUrl && (
        <div
          data-template-region="intro-split-blend-foreground"
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `polygon(${foregroundPolygon})`,
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={splitBlendImageUrl}
            alt="Split blended background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.44,
            }}
          />
        </div>
      )}

      {overlayImageUrl?.trim() && (
        <img
          data-template-region="intro-split-background-svg"
          src={overlayImageUrl}
          alt="Split background asset"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: splitOpacity,
            transform: `translate(${resolvedBackgroundX}%, ${resolvedBackgroundY}%) scale(${resolvedBackgroundScale.toFixed(2)})`,
            transformOrigin: "center center",
            zIndex: 1,
          }}
        />
      )}

      {showGrid && (
        <GridPattern
          pattern={gridPattern}
          color={theme.accent}
          width={width}
          height={height}
        />
      )}

      <div
        data-template-region={
          titleSide === "left"
            ? "intro-split-foreground-right"
            : "intro-split-foreground-left"
        }
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `polygon(${foregroundPolygon})`,
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {tutorialImageUrl?.trim() ? (
          <img
            src={tutorialImageUrl}
            alt="Split foreground"
            style={{
              width: "100%",
              height: "100%",
              objectFit: splitForegroundFit,
              transform: `translate(${splitForegroundX}%, ${splitForegroundY}%) scale(${splitForegroundScale.toFixed(2)})`,
              transformOrigin:
                titleSide === "left" ? "right center" : "left center",
              ...splitForegroundMaskStyles,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 72% 28%, rgba(255,255,255,0.16), rgba(255,255,255,0) 58%), radial-gradient(circle at 55% 72%, rgba(255,255,255,0.12), rgba(255,255,255,0) 64%)",
            }}
          />
        )}
      </div>

      <div
        data-template-region={
          titleSide === "left"
            ? "intro-split-title-left"
            : "intro-split-title-right"
        }
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: titleSide === "left" ? "flex-start" : "flex-end",
          padding: `0 ${Math.round(112 * scale)}px`,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: `${Math.round(width * 0.46)}px`,
            maxWidth: "46%",
            padding:
              surfaceStyle === "standard"
                ? `${Math.round(20 * scale)}px 0`
                : `${Math.round(28 * scale)}px ${Math.round(34 * scale)}px`,
            borderRadius:
              surfaceStyle === "standard" ? undefined : Math.round(30 * scale),
            ...titlePanelStyle,
            textAlign: titleSide,
          }}
        >
          <div
            data-template-region="intro-split-type-capsule"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: Math.max(8, Math.round(10 * scale)),
              borderRadius: 999,
              border: `1px solid ${theme.accent}5C`,
              background: "rgba(15, 23, 42, 0.48)",
              backdropFilter: `blur(${Math.max(4, Math.round(5 * scale))}px)`,
              padding: `${Math.round(splitTypeCapsuleSizing.paddingY * scale)}px ${Math.round(splitTypeCapsuleSizing.paddingX * scale)}px`,
              color: theme.textPrimary,
              fontSize: Math.round(splitTypeCapsuleSizing.textSize * scale),
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: Math.round(
                splitTypeCapsuleSizing.marginBottom * scale,
              ),
              fontFamily: primaryFont,
            }}
          >
            <span
              data-template-region="intro-split-type-capsule-icon"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <SplitTypeCapsuleIcon
                type={splitTypeCapsuleValue}
                size={Math.max(
                  16,
                  Math.round(splitTypeCapsuleSizing.textSize * scale * 1.05),
                )}
                color={theme.accent}
              />
            </span>
            <span>{splitTypeCapsuleLabel}</span>
          </div>
          <div
            style={{
              color: theme.textPrimary,
              fontSize: titleSize,
              fontWeight: 820,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              fontFamily: secondaryFont,
            }}
          >
            {title}
          </div>
        </div>
      </div>

      <svg
        data-template-region="intro-split-divider-glow"
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient
            id="intro-split-glass-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <polyline
          points={buildSplitDividerPolylinePoints(
            splitPartition.points,
            width,
            height,
          )}
          fill="none"
          stroke="url(#intro-split-glass-gradient)"
          strokeWidth={Math.max(20, Math.round(24 * scale))}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.14}
          style={{ filter: `blur(${Math.max(4, Math.round(5 * scale))}px)` }}
        />
        <polyline
          points={buildSplitDividerPolylinePoints(
            splitPartition.points,
            width,
            height,
          )}
          fill="none"
          stroke={theme.accent}
          strokeWidth={Math.max(10, Math.round(14 * scale))}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.08}
          style={{ filter: `blur(${Math.max(3, Math.round(4 * scale))}px)` }}
        />
      </svg>

      <ThumbnailCapsules
        values={values}
        theme={theme}
        scale={scale}
        fontFamily={primaryFont}
      />

      {bottomCornerIconUrls.length > 0 && (
        <div
          data-template-region="intro-split-corner-icons"
          style={{
            position: "absolute",
            bottom: Math.round(splitTypeCapsuleSizing.insetY * scale),
            left:
              bottomCornerSide === "left"
                ? Math.round(splitTypeCapsuleSizing.insetX * scale)
                : undefined,
            right:
              bottomCornerSide === "right"
                ? Math.round(splitTypeCapsuleSizing.insetX * scale)
                : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent:
              bottomCornerSide === "right" ? "flex-end" : "flex-start",
            gap: Math.round(splitTypeCapsuleSizing.groupGap * scale),
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          {bottomCornerIconUrls.map((iconUrl, index) => (
            <img
              key={`${iconUrl}-${index}`}
              data-template-region="intro-split-corner-icon"
              src={iconUrl}
              alt={`Split corner icon ${index + 1}`}
              style={{
                width: bottomCornerIconDimension,
                height: bottomCornerIconDimension,
                objectFit: "contain",
                filter: `drop-shadow(0 ${Math.max(8, Math.round(6 * scale))}px ${Math.max(18, Math.round(12 * scale))}px ${theme.background})`,
              }}
            />
          ))}
        </div>
      )}

      <ThumbnailFooter
        width={width}
        color={theme.textSecondary}
        fontSize={fontSize}
        footerFontFamily={primaryFont}
        size={footerSize}
        renderMode={socialRenderMode}
        text={copyrightText}
      />
    </div>
  );
}
