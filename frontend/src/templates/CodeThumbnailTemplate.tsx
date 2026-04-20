import type { TemplateProps } from "./types";
import { textSizeToMultiplier } from "./index";
import {
  getGridPatternMetrics,
  getScaledBorderWidth,
  type GridPatternName,
} from "./rendering";
import { ThumbnailFooter } from "./ThumbnailFooter";

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
  const metrics = getGridPatternMetrics(pattern as GridPatternName, width);

  switch (pattern) {
    case "dots":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}
        >
          <defs>
            <pattern
              id={`code-${pattern}`}
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
          <rect width="100%" height="100%" fill={`url(#code-${pattern})`} />
        </svg>
      );
    case "grid":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}
        >
          <defs>
            <pattern
              id={`code-${pattern}`}
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
          <rect width="100%" height="100%" fill={`url(#code-${pattern})`} />
        </svg>
      );
    case "diagonal":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}
        >
          <defs>
            <pattern
              id={`code-${pattern}`}
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
          <rect width="100%" height="100%" fill={`url(#code-${pattern})`} />
        </svg>
      );
    case "cross":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}
        >
          <defs>
            <pattern
              id={`code-${pattern}`}
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
          <rect width="100%" height="100%" fill={`url(#code-${pattern})`} />
        </svg>
      );
    case "hexagon":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}
        >
          <defs>
            <pattern
              id={`code-${pattern}`}
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
          <rect width="100%" height="100%" fill={`url(#code-${pattern})`} />
        </svg>
      );
    case "circuit":
      return (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}
        >
          <defs>
            <pattern
              id={`code-${pattern}`}
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
          <rect width="100%" height="100%" fill={`url(#code-${pattern})`} />
        </svg>
      );
    default:
      return null;
  }
}

export function CodeThumbnailTemplate({
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
    Math.round(fontSize * 1.2 * scale) *
    textSizeToMultiplier(values["title_size"] ?? "lg");
  const codeSize = Math.round(fontSize * 0.45 * scale);
  const showGrid = values["show_grid"] !== "false";
  const gridPattern = values["grid_pattern"] ?? "dots";
  const badge = values["badge"] ?? "";
  const language = values["language"] ?? "";
  const codeSnippet = values["code_snippet"] ?? "console.log('Hello');";

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
          renderMode="only"
          text={copyrightText}
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
        background:
          theme.backgroundImage ??
          `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`,
        border:
          borderWidth > 0
            ? `${getScaledBorderWidth(width, borderWidth)}px solid ${borderColor}`
            : "none",
      }}
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
          padding: `${Math.round(40 * scale)}px ${Math.round(50 * scale)}px`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: Math.round(10 * scale),
            marginBottom: Math.round(20 * scale),
          }}
        >
          {badge && (
            <span
              style={{
                background: theme.accent,
                color: theme.background,
                fontSize: Math.round(fontSize * 0.3 * scale),
                fontWeight: 800,
                padding: `${Math.round(4 * scale)}px ${Math.round(12 * scale)}px`,
                borderRadius: Math.round(4 * scale),
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </span>
          )}
          {language && (
            <span
              style={{
                background: `${theme.accent}30`,
                color: theme.accent,
                fontSize: Math.round(fontSize * 0.3 * scale),
                fontWeight: 700,
                padding: `${Math.round(4 * scale)}px ${Math.round(12 * scale)}px`,
                borderRadius: Math.round(4 * scale),
                border: `1px solid ${theme.accent}50`,
              }}
            >
              {language}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            color: theme.textPrimary,
            lineHeight: 1.1,
            marginBottom: Math.round(24 * scale),
            maxWidth: "85%",
            fontFamily: secondaryFont,
          }}
        >
          {values["title"] ?? "Code Tutorial"}
        </div>

        <div
          style={{
            background: `${theme.surface}cc`,
            borderRadius: Math.round(12 * scale),
            padding: `${Math.round(16 * scale)}px ${Math.round(20 * scale)}px`,
            border: `1px solid ${theme.accent}30`,
            maxWidth: "70%",
            flex: 1,
            maxHeight: Math.round(height * 0.35),
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: Math.round(6 * scale),
              marginBottom: Math.round(12 * scale),
            }}
          >
            <div
              style={{
                width: Math.round(10 * scale),
                height: Math.round(10 * scale),
                borderRadius: "50%",
                background: "#ff5f56",
              }}
            />
            <div
              style={{
                width: Math.round(10 * scale),
                height: Math.round(10 * scale),
                borderRadius: "50%",
                background: "#ffbd2e",
              }}
            />
            <div
              style={{
                width: Math.round(10 * scale),
                height: Math.round(10 * scale),
                borderRadius: "50%",
                background: "#27ca40",
              }}
            />
          </div>
          <pre
            style={{
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              fontSize: codeSize,
              color: theme.accent,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              lineHeight: 1.5,
            }}
          >
            {codeSnippet}
          </pre>
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
        renderMode={socialRenderMode}
        text={copyrightText}
      />
    </div>
  );
}
