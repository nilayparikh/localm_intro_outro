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
  const opacity = 0.3;
  const patternColor = color;
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
              id="centered-dots"
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
                fill={patternColor}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#centered-dots)" />
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
              id="centered-grid"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${metrics.tileWidth} 0 L 0 0 0 ${metrics.tileHeight}`}
                fill="none"
                stroke={patternColor}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#centered-grid)" />
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
              id="centered-diag"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M 0 ${metrics.tileHeight} L ${metrics.tileWidth} 0`}
                fill="none"
                stroke={patternColor}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#centered-diag)" />
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
              id="centered-cross"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${metrics.pointX} 0 L ${metrics.pointX} ${metrics.tileHeight} M 0 ${metrics.pointY} L ${metrics.tileWidth} ${metrics.pointY}`}
                fill="none"
                stroke={patternColor}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#centered-cross)" />
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
              id="centered-hex"
              x="0"
              y="0"
              width={metrics.tileWidth}
              height={metrics.tileHeight}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${Math.round(metrics.tileWidth / 2)} 0 L ${metrics.tileWidth} ${Math.round(metrics.tileHeight * 0.17)} ${metrics.tileWidth} ${Math.round(metrics.tileHeight * 0.5)} ${Math.round(metrics.tileWidth / 2)} ${Math.round(metrics.tileHeight * 0.67)} 0 ${Math.round(metrics.tileHeight * 0.5)} 0 ${Math.round(metrics.tileHeight * 0.17)}Z`}
                fill="none"
                stroke={patternColor}
                strokeWidth={metrics.strokeWidth}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#centered-hex)" />
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
              id="centered-circuit"
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
                fill={patternColor}
              />
              <path
                d={`M ${metrics.pointX} ${metrics.pointY} L ${Math.round(metrics.tileWidth * 0.83)} ${metrics.pointY} ${Math.round(metrics.tileWidth * 0.83)} ${Math.round(metrics.tileHeight * 0.83)}`}
                fill="none"
                stroke={patternColor}
                strokeWidth={metrics.strokeWidth}
              />
              <circle
                cx={Math.round(metrics.tileWidth * 0.83)}
                cy={Math.round(metrics.tileHeight * 0.83)}
                r={metrics.dotRadius}
                fill={patternColor}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#centered-circuit)" />
        </svg>
      );
    default:
      return null;
  }
}

export function CenteredThumbnailTemplate({
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
  tutorialImageSize = 100,
  tutorialImageOpacity = 100,
  copyrightText,
}: TemplateProps) {
  const scale = width / 1280;
  const primaryFont = primaryFontFamily ?? fontFamily ?? "'Outfit', sans-serif";
  const secondaryFont =
    secondaryFontFamily ?? fontFamily ?? "'Share Tech Mono', monospace";
  const titleSize =
    Math.round(fontSize * 1.4 * scale) *
    textSizeToMultiplier(values["title_size"] ?? "lg");
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
  const contentPanelStyle = buildTemplatePanelStyle({
    surfaceStyle,
    theme,
    scale,
    shadowStyle: surfaceShadow,
  });

  const tutorialScalePercent = Math.min(250, Math.max(50, tutorialImageSize));
  const imageOpacity = Math.min(100, Math.max(0, tutorialImageOpacity)) / 100;

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
      {tutorialImageUrl && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
            opacity: imageOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={tutorialImageUrl}
            alt="Tutorial Background"
            style={{
              width: Math.round(width * (tutorialScalePercent / 100)),
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      )}

      {showGrid && (
        <GridPattern
          pattern={gridPattern}
          color={theme.accent}
          width={width}
          height={height}
        />
      )}

      <ThumbnailCapsules
        values={values}
        theme={theme}
        scale={scale}
        fontFamily={primaryFont}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `${Math.round(40 * scale)}px ${Math.round(60 * scale)}px`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            color: theme.textPrimary,
            lineHeight: 1.1,
            textAlign: "center",
            wordWrap: "break-word",
            fontFamily: secondaryFont,
            maxWidth: surfaceStyle === "standard" ? "90%" : "92%",
            padding:
              surfaceStyle === "standard"
                ? undefined
                : `${Math.round(26 * scale)}px ${Math.round(32 * scale)}px`,
            borderRadius:
              surfaceStyle === "standard" ? undefined : Math.round(28 * scale),
            ...contentPanelStyle,
          }}
        >
          {values["title"] ?? "Tutorial Title"}
        </div>
      </div>

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
