import type { TemplateProps } from "./types";
import { textSizeToMultiplier } from "./index";
import {
  getGridPatternMetrics,
  getScaledBorderWidth,
  type GridPatternName,
} from "./rendering";

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

function SocialFooter({
  width,
  color,
  fontSize,
  footerFontFamily,
  renderMode = "full",
}: {
  position: "left" | "center" | "right";
  width: number;
  color: string;
  fontSize: number;
  footerFontFamily: string;
  renderMode?: "full" | "hidden" | "only";
}) {
  if (renderMode === "hidden") return null;

  const scale = width / 1280;
  const textSize = Math.round(fontSize * 0.28 * scale);

  return (
    <div
      style={{
        position: "absolute",
        bottom: Math.round(12 * scale),
        left: Math.round(24 * scale),
        right: Math.round(24 * scale),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 4,
      }}
    >
      <div
        style={{
          marginTop: Math.round(8 * scale),
          color,
          fontFamily: footerFontFamily,
          fontSize: textSize,
          opacity: 0.72,
        }}
      >
        © 2026 LocalM™. All rights reserved.
      </div>
    </div>
  );
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
  socialPosition,
  socialRenderMode = "full",
  borderWidth,
  borderColor,
  transparentBackground = false,
  tutorialImageUrl,
  tutorialImageSize = 100,
  tutorialImageOpacity = 100,
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
        <SocialFooter
          position={socialPosition}
          width={width}
          color={theme.textSecondary}
          fontSize={fontSize}
          footerFontFamily={primaryFont}
          renderMode="only"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        fontFamily: primaryFont,
        background: transparentBackground
          ? "none"
          : (theme.backgroundImage ??
            `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`),
        border:
          borderWidth > 0
            ? `${getScaledBorderWidth(width, borderWidth)}px solid ${borderColor}`
            : "none",
      }}
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

      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "60%",
          height: "60%",
          background: `radial-gradient(circle, ${theme.accent}15, transparent 70%)`,
          pointerEvents: "none",
        }}
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
            maxWidth: "90%",
          }}
        >
          {values["title"] ?? "Tutorial Title"}
        </div>
      </div>

      <SocialFooter
        position={socialPosition}
        width={width}
        color={theme.textSecondary}
        fontSize={fontSize}
        footerFontFamily={primaryFont}
        renderMode={socialRenderMode}
      />
    </div>
  );
}
