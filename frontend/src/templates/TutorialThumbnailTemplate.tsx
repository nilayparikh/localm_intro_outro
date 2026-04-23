import type { TemplateProps } from "./types";
import { textSizeToMultiplier } from "./index";
import {
  buildTemplateFrameStyle,
  buildTemplatePanelStyle,
  colorWithAlpha,
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
              id="dots"
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
          <rect width="100%" height="100%" fill="url(#dots)" />
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
              id="grid"
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
          <rect width="100%" height="100%" fill="url(#grid)" />
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
              id="diag"
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
          <rect width="100%" height="100%" fill="url(#diag)" />
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
              id="cross"
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
          <rect width="100%" height="100%" fill="url(#cross)" />
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
              id="hex"
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
          <rect width="100%" height="100%" fill="url(#hex)" />
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
              id="circuit"
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
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      );
    default:
      return null;
  }
}

export function TutorialThumbnailTemplate({
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
  brandLogoUrl,
  brandLogoSize = 180,
  transparentBackground = false,
  tutorialImageUrl,
  tutorialImageSize = 100,
  tutorialImageBottomPadding = 24,
  copyrightText,
}: TemplateProps) {
  const scale = width / 1280;
  const primaryFont = primaryFontFamily ?? fontFamily ?? "'Outfit', sans-serif";
  const secondaryFont =
    secondaryFontFamily ?? fontFamily ?? "'Share Tech Mono', monospace";
  const tutorialScalePercent = Math.min(250, Math.max(50, tutorialImageSize));
  const tutorialScale = tutorialScalePercent / 100;
  const tutorialBaseHeight = Math.round(height * 0.35);
  const tutorialBottomPadding = Math.round(tutorialImageBottomPadding * scale);
  const titleSize =
    Math.round(fontSize * 1.4 * scale) *
    textSizeToMultiplier(values["title_size"] ?? "lg");
  const secondarySizeMultiplier = textSizeToMultiplier(
    values["secondary_size"] ?? "md",
  );
  const subtitleSize = Math.round(
    fontSize * 0.6 * scale * secondarySizeMultiplier,
  );
  const metadataSize = Math.round(
    fontSize * 0.35 * scale * secondarySizeMultiplier,
  );
  const showGrid = values["show_grid"] !== "false";
  const gridPattern = values["grid_pattern"] ?? "dots";
  const badge = values["badge"] ?? "";
  const episode = values["episode"] ?? "";
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

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: `${Math.round(40 * scale)}px ${Math.round(60 * scale)}px`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            alignSelf: "flex-start",
            maxWidth: surfaceStyle === "standard" ? "90%" : "92%",
            padding:
              surfaceStyle === "standard"
                ? undefined
                : `${Math.round(24 * scale)}px ${Math.round(28 * scale)}px`,
            borderRadius:
              surfaceStyle === "standard" ? undefined : Math.round(24 * scale),
            ...contentPanelStyle,
          }}
        >
          {badge && (
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                background:
                  surfaceStyle === "standard"
                    ? `${theme.surface}cc`
                    : colorWithAlpha(theme.surface, 0.46),
                color: theme.textSecondary,
                border: `1px solid ${colorWithAlpha(theme.accent, 0.35)}`,
                fontSize: metadataSize,
                fontWeight: 800,
                padding: `${Math.round(6 * scale)}px ${Math.round(16 * scale)}px`,
                borderRadius: Math.round(999 * scale),
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: Math.round(16 * scale),
              }}
            >
              {badge}
              {episode && ` • ${episode}`}
            </div>
          )}

          <div
            style={{
              fontSize: titleSize,
              fontWeight: 900,
              color: theme.textPrimary,
              lineHeight: 1.1,
              maxWidth: "100%",
              wordWrap: "break-word",
              fontFamily: secondaryFont,
            }}
          >
            {values["title"] ?? "Tutorial Title"}
          </div>

          {values["subtitle"] && (
            <div
              style={{
                fontSize: subtitleSize,
                color: theme.textSecondary,
                marginTop: Math.round(12 * scale),
                maxWidth: "100%",
                lineHeight: 1.4,
                fontFamily: primaryFont,
              }}
            >
              {values["subtitle"]}
            </div>
          )}
        </div>
      </div>

      {brandLogoUrl && (
        <div
          style={{
            position: "absolute",
            top: Math.round(20 * scale),
            right: Math.round(24 * scale),
            zIndex: 3,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <img
            src={brandLogoUrl}
            alt="Brand Logo"
            style={{
              width: Math.round(brandLogoSize * scale),
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {tutorialImageUrl && (
        <div
          style={{
            position: "absolute",
            bottom: tutorialBottomPadding,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            overflow: "visible",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transform: `scale(${tutorialScale})`,
              transformOrigin: "bottom center",
            }}
          >
            <img
              src={tutorialImageUrl}
              alt="Tutorial"
              style={{
                height: tutorialBaseHeight,
                width: "auto",
                objectFit: "contain",
                borderRadius: Math.round(8 * scale),
                maxWidth: Math.round(width * 0.9),
                display: "block",
              }}
            />
          </div>
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
