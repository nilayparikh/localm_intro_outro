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
  const opacity = 0.28;
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
              id="intro-bite-dots"
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
          <rect width="100%" height="100%" fill="url(#intro-bite-dots)" />
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
              id="intro-bite-grid"
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
          <rect width="100%" height="100%" fill="url(#intro-bite-grid)" />
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
              id="intro-bite-diag"
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
          <rect width="100%" height="100%" fill="url(#intro-bite-diag)" />
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
              id="intro-bite-cross"
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
          <rect width="100%" height="100%" fill="url(#intro-bite-cross)" />
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
              id="intro-bite-hex"
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
          <rect width="100%" height="100%" fill="url(#intro-bite-hex)" />
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
              id="intro-bite-circuit"
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
          <rect width="100%" height="100%" fill="url(#intro-bite-circuit)" />
        </svg>
      );
    default:
      return null;
  }
}

export function IntroBiteThumbnailTemplate({
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
  copyrightText,
}: TemplateProps) {
  const scale = width / 1280;
  const typographyScale = Math.min(scale, 1.2);
  const primaryFont = primaryFontFamily ?? fontFamily ?? "'Outfit', sans-serif";
  const secondaryFont =
    secondaryFontFamily ?? fontFamily ?? "'Share Tech Mono', monospace";
  const titleSize = Math.round(
    fontSize *
      1.34 *
      typographyScale *
      textSizeToMultiplier(values["title_size"] ?? "lg"),
  );
  const secondarySizeMultiplier = textSizeToMultiplier(
    values["secondary_size"] ?? "md",
  );
  const sourceTitleScale = Math.min(
    0.92,
    Math.max(0.68, 0.8 * secondarySizeMultiplier),
  );
  const eyebrowSize = Math.round(
    fontSize * 0.42 * typographyScale * secondarySizeMultiplier,
  );
  const sourceTitleSize = Math.round(titleSize * sourceTitleScale);
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
  const sourceLabel = values["source_label"]?.trim() || "BITE FROM";
  const sourceTitle =
    values["source_title"]?.trim() || "Context Engineering for GitHub Copilot";

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
        variant="intro-bite"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${Math.round(46 * scale)}px ${Math.round(64 * scale)}px`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.round(24 * scale),
            maxWidth: "88%",
            padding:
              surfaceStyle === "standard"
                ? undefined
                : `${Math.round(28 * scale)}px ${Math.round(36 * scale)}px`,
            borderRadius:
              surfaceStyle === "standard" ? undefined : Math.round(30 * scale),
            ...contentPanelStyle,
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 900,
              color: theme.textPrimary,
              lineHeight: 1.06,
              textAlign: "center",
              wordWrap: "break-word",
              fontFamily: secondaryFont,
              maxWidth: "100%",
              textTransform: "uppercase",
            }}
          >
            {values["title"] ?? "5 Copilot Prompts That Save Time"}
          </div>

          <div
            data-template-region="bite-source"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: Math.round(18 * scale),
              maxWidth: "94%",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: `${Math.round(14 * scale)}px ${Math.round(31 * scale)}px`,
                borderRadius: 999,
                border: `1px solid ${theme.accent}66`,
                background: `linear-gradient(135deg, ${theme.accent}24, ${theme.textPrimary}10)`,
                boxShadow: `0 ${Math.round(10 * scale)}px ${Math.round(28 * scale)}px rgba(11, 17, 32, 0.16)`,
                fontSize: eyebrowSize,
                fontWeight: 900,
                letterSpacing: "0.2em",
                color: theme.textPrimary,
                fontFamily: primaryFont,
                lineHeight: 1,
                textAlign: "center",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {sourceLabel}
            </div>

            <div
              style={{
                fontSize: sourceTitleSize,
                fontWeight: 760,
                color: theme.textPrimary,
                fontFamily: secondaryFont,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                textAlign: "center",
                maxWidth: "100%",
                opacity: 0.9,
              }}
            >
              {sourceTitle}
            </div>
          </div>
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
