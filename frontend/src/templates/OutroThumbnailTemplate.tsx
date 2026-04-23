import type { TemplateProps } from "./types";
import { textSizeToMultiplier } from "./index";
import { OUTRO_ARROW_ASSET_RESOURCES } from "./outroArrowAssets";
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
const DEFAULT_OUTRO_SUBTITLE = "Want more? Subscribe and press the bell";

function sanitizeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function OutroArrowOverlays({
  width,
  overlays,
  textFontFamily,
  theme,
}: {
  width: number;
  overlays: TemplateProps["outroArrowOverlays"];
  textFontFamily: string;
  theme: TemplateProps["theme"];
}) {
  if (!overlays || overlays.length === 0) {
    return null;
  }

  const svgScale = width / 1300;

  return (
    <>
      {overlays.map((overlay) => {
        const asset = OUTRO_ARROW_ASSET_RESOURCES[overlay.type];
        const variant = overlay.isInverse ? asset.inverse : asset.regular;
        const overlayId = sanitizeSvgId(overlay.id);
        const textPathId = `outro-arrow-text-${overlayId}`;
        const strokeGradientId = `outro-arrow-stroke-${overlayId}`;
        const fillGradientId = `outro-arrow-fill-${overlayId}`;
        const widthScale = overlay.arrowWidth / 100;
        const heightScale = overlay.arrowHeight / 100;
        const averageScale = (widthScale + heightScale) / 2;
        const textScale = overlay.textSize / 100;
        const svgWidth = Math.round(
          variant.referenceWidth * svgScale * widthScale,
        );
        const svgHeight = Math.round(
          variant.referenceHeight * svgScale * heightScale,
        );
        const fontSize = Math.max(
          16,
          Math.round(variant.fontSize * svgScale * averageScale * textScale),
        );
        const strokeWidth = Math.max(
          2,
          Number((2.4 * svgScale * averageScale).toFixed(2)),
        );

        return (
          <div
            key={overlay.id}
            data-template-region="outro-arrow-overlay"
            data-overlay-id={overlay.id}
            data-overlay-text-size={overlay.textSize}
            data-overlay-arrow-width={overlay.arrowWidth}
            data-overlay-arrow-height={overlay.arrowHeight}
            style={{
              position: "absolute",
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              width: `${svgWidth}px`,
              height: `${svgHeight}px`,
              transform: `translate(-50%, -50%) rotate(${overlay.degree}deg)`,
              transformOrigin: "center center",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={variant.viewBox}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                overflow: "visible",
                filter: `drop-shadow(0 ${Math.round(Math.max(8, svgScale * 10))}px ${Math.round(Math.max(14, svgScale * 18))}px ${colorWithAlpha(theme.background, 0.55)})`,
              }}
            >
              <defs>
                <linearGradient
                  id={fillGradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={asset.fillStart} />
                  <stop offset="100%" stopColor={asset.fillEnd} />
                </linearGradient>
                <linearGradient
                  id={strokeGradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={asset.strokeStart} />
                  <stop offset="100%" stopColor={asset.strokeEnd} />
                </linearGradient>
                <path id={textPathId} d={variant.textPathD} />
              </defs>
              <path
                d={variant.arrowPathD}
                fill={`url(#${fillGradientId})`}
                stroke={`url(#${strokeGradientId})`}
                strokeWidth={strokeWidth}
              />
              <text
                fontFamily={textFontFamily}
                fontSize={fontSize}
                fontWeight={600}
                fill="#ffffff"
                letterSpacing="0.06em"
              >
                <textPath
                  href={`#${textPathId}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {overlay.text}
                </textPath>
              </text>
            </svg>
          </div>
        );
      })}
    </>
  );
}

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
  transparentBackground = false,
  tutorialImageUrl,
  tutorialImageSize = 100,
  tutorialImageOpacity = 100,
  outroArrowOverlays,
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
  const showSuggestedImage = values["show_outro_image"] !== "false";
  const gridPattern = values["grid_pattern"] ?? "dots";
  const surfaceStyle = resolveTemplateSurfaceStyle(values["surface_style"]);
  const surfaceShadow = resolveTemplateSurfaceShadowStyle(
    values["surface_shadow"],
  );
  const borderStyle = resolveTemplateBorderStyle(values["border_style"]);
  const borderColorSecondary =
    values["border_color_secondary"]?.trim() || undefined;
  const footerSize = resolveFooterSize(values["footer_size"]);
  const tutorialScalePercent = Math.min(180, Math.max(55, tutorialImageSize));
  const imageOpacity = Math.min(100, Math.max(0, tutorialImageOpacity)) / 100;
  const tutorialImageSource = tutorialImageUrl?.trim()
    ? tutorialImageUrl.trim()
    : null;
  const suggestedImageWidth = Math.round(
    width * 0.27 * (tutorialScalePercent / 100),
  );
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

      {showSuggestedImage && tutorialImageSource && (
        <div
          data-template-region="outro-suggested-image"
          style={{
            position: "absolute",
            right: `${Math.round(72 * scale)}px`,
            bottom: `${Math.round(138 * scale)}px`,
            width: `${suggestedImageWidth}px`,
            padding: `${Math.round(18 * scale)}px`,
            borderRadius: `${Math.round(30 * scale)}px`,
            background: `linear-gradient(180deg, ${colorWithAlpha(theme.surface, 0.56)}, ${colorWithAlpha(theme.background, 0.34)})`,
            border: `1px solid ${colorWithAlpha(theme.textPrimary, 0.18)}`,
            boxShadow: `0 ${Math.round(18 * scale)}px ${Math.round(44 * scale)}px ${colorWithAlpha(theme.background, 0.34)}`,
            backdropFilter: `blur(${Math.round(26 * scale)}px)`,
            WebkitBackdropFilter: `blur(${Math.round(26 * scale)}px)`,
            zIndex: 1,
          }}
        >
          <img
            src={tutorialImageSource}
            alt="Suggested Course Preview"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: `${Math.round(20 * scale)}px`,
              objectFit: "cover",
              opacity: imageOpacity,
            }}
          />
        </div>
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
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            color: theme.textPrimary,
            lineHeight: 1.04,
            fontFamily: secondaryFont,
            textTransform: "uppercase",
            maxWidth: "92%",
          }}
        >
          {values["title"] ?? DEFAULT_OUTRO_TITLE}
        </div>

        <div
          style={{
            fontSize: subtitleSize,
            fontWeight: 600,
            color: theme.textSecondary,
            lineHeight: 1.24,
            fontFamily: primaryFont,
            maxWidth: "74%",
          }}
        >
          {values["subtitle"] ?? DEFAULT_OUTRO_SUBTITLE}
        </div>
      </div>

      <OutroArrowOverlays
        width={width}
        overlays={outroArrowOverlays}
        textFontFamily={secondaryFont}
        theme={theme}
      />

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
