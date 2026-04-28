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
  const opacity = 0.24;
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
              id="outro-dots"
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
          <rect width="100%" height="100%" fill="url(#outro-dots)" />
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
              id="outro-grid"
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
          <rect width="100%" height="100%" fill="url(#outro-grid)" />
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
              id="outro-diag"
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
          <rect width="100%" height="100%" fill="url(#outro-diag)" />
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
              id="outro-cross"
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
          <rect width="100%" height="100%" fill="url(#outro-cross)" />
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
              id="outro-hex"
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
          <rect width="100%" height="100%" fill="url(#outro-hex)" />
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
              id="outro-circuit"
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
          <rect width="100%" height="100%" fill="url(#outro-circuit)" />
        </svg>
      );
    default:
      return null;
  }
}

const DEFAULT_OUTRO_TITLE = "Thank You for Watching";

export function OutroThumbnailTemplate({
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
  overlayImageUrl,
  overlayImageScale,
  overlayImageX,
  overlayImageY,
  transparentBackground = false,
  copyrightText,
}: TemplateProps) {
  const scale = width / 1280;
  const typographyScale = Math.min(scale, 1.2);
  const primaryFont = primaryFontFamily ?? fontFamily ?? "'Outfit', sans-serif";
  const secondaryFont =
    secondaryFontFamily ?? fontFamily ?? "'Share Tech Mono', monospace";
  const secondarySizeMultiplier = textSizeToMultiplier(
    values["secondary_size"] ?? "md",
  );
  const titleSize = Math.round(
    fontSize *
      0.72 *
      typographyScale *
      textSizeToMultiplier(values["title_size"] ?? "lg"),
  );
  const subtitleSize = Math.max(
    Math.round(titleSize * 0.8 * secondarySizeMultiplier),
    14,
  );
  const showGrid = values["show_grid"] !== "false";
  const gridPattern = values["grid_pattern"] ?? "dots";
  const surfaceStyle = resolveTemplateSurfaceStyle(values["surface_style"]);
  const surfaceShadow = resolveTemplateSurfaceShadowStyle(
    values["surface_shadow"],
  );
  const borderStyle = resolveTemplateBorderStyle(values["border_style"]);
  const backgroundSvgOpacity =
    Math.min(
      100,
      Math.max(
        0,
        Number.parseFloat(values["outro_background_opacity"] ?? "55"),
      ),
    ) / 100;
  const resolvedBackgroundScale =
    Math.min(180, Math.max(50, overlayImageScale ?? 100)) / 100;
  const resolvedBackgroundX = Math.min(24, Math.max(-24, overlayImageX ?? 0));
  const resolvedBackgroundY = Math.min(24, Math.max(-24, overlayImageY ?? 0));
  const supportLines = (values["subtitle"] ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const borderColorSecondary =
    values["border_color_secondary"]?.trim() || undefined;
  const footerSize = resolveFooterSize(values["footer_size"]);
  const contentPanelStyle = buildTemplatePanelStyle({
    surfaceStyle,
    theme,
    scale,
    shadowStyle: surfaceShadow,
  });
  const headlineBackgroundStyle = resolveTemplateSurfaceStyle(
    values["outro_headline_background"] === "glass" ? "glass" : "standard",
  );
  const hasHeadlineGlassBackground = headlineBackgroundStyle !== "standard";
  const headlinePanelStyle = buildTemplatePanelStyle({
    surfaceStyle: headlineBackgroundStyle,
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
      {showGrid && (
        <GridPattern
          pattern={gridPattern}
          color={theme.accent}
          width={width}
          height={height}
        />
      )}

      {overlayImageUrl?.trim() && (
        <img
          data-template-region="outro-background-svg"
          src={overlayImageUrl}
          alt="Outro background asset"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: backgroundSvgOpacity,
            transform: `translate(${resolvedBackgroundX}%, ${resolvedBackgroundY}%) scale(${resolvedBackgroundScale.toFixed(2)})`,
            transformOrigin: "center center",
            zIndex: 1,
          }}
        />
      )}

      <div
        data-template-region="outro-cta"
        style={{
          position: "absolute",
          top: `${Math.round(68 * scale)}px`,
          left: "50%",
          transform: "translateX(-50%)",
          width: "88%",
          maxWidth: `${Math.round(1080 * scale)}px`,
          minHeight: `${Math.round(height * 0.3)}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${Math.round(24 * scale)}px`,
          padding:
            surfaceStyle === "standard"
              ? `${Math.round(24 * scale)}px ${Math.round(16 * scale)}px`
              : `${Math.round(28 * scale)}px ${Math.round(36 * scale)}px`,
          borderRadius:
            surfaceStyle === "standard" ? undefined : Math.round(34 * scale),
          textAlign: "center",
          zIndex: 2,
          ...contentPanelStyle,
        }}
      >
        <div
          data-template-region="outro-headline-panel"
          style={{
            maxWidth: "92%",
            padding: hasHeadlineGlassBackground
              ? `${Math.round(18 * scale)}px ${Math.round(32 * scale)}px`
              : undefined,
            borderRadius: hasHeadlineGlassBackground
              ? `${Math.round(28 * scale)}px`
              : undefined,
            ...headlinePanelStyle,
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 900,
              color: theme.textPrimary,
              lineHeight: 1.04,
              fontFamily: secondaryFont,
              textTransform: "uppercase",
              maxWidth: "100%",
            }}
          >
            {values["title"] ?? DEFAULT_OUTRO_TITLE}
          </div>
        </div>

        <div
          data-template-region="outro-support-lines"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(10 * scale)}px`,
            alignItems: "center",
            maxWidth: "74%",
          }}
        >
          {supportLines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                fontSize: subtitleSize,
                fontWeight: 600,
                color: theme.textSecondary,
                lineHeight: 1.24,
                fontFamily: primaryFont,
                maxWidth: "100%",
              }}
            >
              {line}
            </div>
          ))}
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
