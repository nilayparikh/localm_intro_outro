import type { TemplateProps } from "./types";
import {
  buildTemplateFrameStyle,
  getGridPatternMetrics,
  resolveTemplateBorderStyle,
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
              id="background-dots"
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
          <rect width="100%" height="100%" fill="url(#background-dots)" />
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
              id="background-grid"
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
          <rect width="100%" height="100%" fill="url(#background-grid)" />
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
              id="background-diagonal"
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
          <rect width="100%" height="100%" fill="url(#background-diagonal)" />
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
              id="background-cross"
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
          <rect width="100%" height="100%" fill="url(#background-cross)" />
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
              id="background-hexagon"
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
          <rect width="100%" height="100%" fill="url(#background-hexagon)" />
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
              id="background-circuit"
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
          <rect width="100%" height="100%" fill="url(#background-circuit)" />
        </svg>
      );
    default:
      return null;
  }
}

export function BackgroundThumbnailTemplate({
  width,
  height,
  values,
  theme,
  fontFamily,
  primaryFontFamily,
  fontSize,
  socialRenderMode = "full",
  borderWidth,
  borderColor,
  brandLogoUrl,
  brandLogoSize = 90,
  transparentBackground = false,
  copyrightText,
}: TemplateProps) {
  const scale = width / 1280;
  const primaryFont = primaryFontFamily ?? fontFamily ?? "'Outfit', sans-serif";
  const showGrid = values["show_grid"] !== "false";
  const gridPattern = values["grid_pattern"] ?? "dots";
  const borderStyle = resolveTemplateBorderStyle(values["border_style"]);
  const borderColorSecondary =
    values["border_color_secondary"]?.trim() || undefined;
  const footerSize = resolveFooterSize(values["footer_size"]);

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
