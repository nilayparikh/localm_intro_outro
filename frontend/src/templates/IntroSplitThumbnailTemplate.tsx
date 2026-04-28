import type { TemplateProps } from "./types";
import { textSizeToMultiplier } from "./index";
import {
  buildTemplateFrameStyle,
  buildTemplatePanelStyle,
  buildTemplateSeparatorStyle,
  getGridPatternMetrics,
  resolveTemplateBorderStyle,
  resolveTemplateSurfaceShadowStyle,
  resolveTemplateSurfaceStyle,
  type GridPatternName,
} from "./rendering";
import {
  ThumbnailCapsules,
  type ExtraThumbnailCapsule,
} from "./ThumbnailCapsules";
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

type SplitBreakpointEffect = "none" | "glass" | "opaque" | "cracked";

type SplitTypeCapsule = "bite" | "course" | "mono" | "debug";

function resolveSplitBreakpointEffect(
  value: string | undefined,
): SplitBreakpointEffect {
  if (value === "none" || value === "opaque" || value === "cracked") {
    return value;
  }

  return "glass";
}

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
    return "Course";
  }

  if (value === "mono") {
    return "Mono";
  }

  if (value === "debug") {
    return "Debug Mode";
  }

  return "BITE";
}

function formatCourseLessonValue(
  value: string | undefined,
  fallback: string,
): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return fallback;
  }

  if (/^\d+$/.test(trimmedValue)) {
    return trimmedValue.padStart(2, "0");
  }

  return trimmedValue;
}

function resolveCourseLessonLabel(
  current: string | undefined,
  total: string | undefined,
): string {
  return `${formatCourseLessonValue(current, "01")} of ${formatCourseLessonValue(total, "10")}`;
}

function resolveSplitTitleWidthPercent(value: string | undefined): number {
  return clamp(Number.parseFloat(value ?? "46"), 30, 72);
}

function resolveSplitCourseBlockScale(value: string | undefined): number {
  return clamp(Number.parseFloat(value ?? "100"), 70, 180) / 100;
}

function resolveSplitCourseTitleGapScale(value: string | undefined): number {
  return clamp(Number.parseFloat(value ?? "60"), 20, 140) / 100;
}

function resolveSplitTitleBlockOffsetPx(
  value: string | undefined,
  height: number,
): number {
  return Math.round(
    (clamp(Number.parseFloat(value ?? "0"), -100, 100) / 100) * height * 0.4,
  );
}

type SplitQuoteStyle = "size_1";

const SPLIT_QUOTE_SVG_WIDTH = 800;
const SPLIT_QUOTE_SVG_HEIGHT = 400;
const SPLIT_QUOTE_MARK_X = 70;
const SPLIT_QUOTE_MARK_Y = 140;
const SPLIT_QUOTE_MARK_FONT_SIZE = 90;
const SPLIT_QUOTE_TEXT_X = 140;
const SPLIT_QUOTE_TEXT_Y = 140;
const SPLIT_QUOTE_TEXT_FONT_SIZE = 30;
const SPLIT_QUOTE_LINE_GAP = 40;

function resolveSplitQuoteStyle(value: string | undefined): SplitQuoteStyle {
  return value === "size_1" ? value : "size_1";
}

function resolveSplitQuoteWidthPercent(value: string | undefined): number {
  return clamp(Number.parseFloat(value ?? "72"), 36, 100);
}

function resolveSplitQuoteFontScale(value: string | undefined): number {
  return clamp(Number.parseFloat(value ?? "100"), 50, 220) / 100;
}

function resolveSplitQuoteMarkScale(value: string | undefined): number {
  return clamp(Number.parseFloat(value ?? "100"), 40, 220) / 100;
}

function resolveSplitQuoteTopPx(
  value: string | undefined,
  height: number,
  quoteHeight: number,
): number {
  const normalized =
    (clamp(Number.parseFloat(value ?? "0"), -100, 100) + 100) / 200;
  return Math.round(Math.max(0, height - quoteHeight) * normalized);
}

function resolveSplitQuoteOffsetPx(
  value: string | undefined,
  width: number,
  quoteWidth: number,
  anchorLeft: number,
): number {
  const normalized =
    (clamp(Number.parseFloat(value ?? "-100"), -100, 100) + 100) / 200;
  const targetLeft = Math.round(Math.max(0, width - quoteWidth) * normalized);
  return targetLeft - anchorLeft;
}

function wrapQuoteText(text: string, maxCharactersPerLine: number): string[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return [];
  }

  const words = normalizedText.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;

    if (!currentLine || candidateLine.length <= maxCharactersPerLine) {
      currentLine = candidateLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
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

function mapSplitPointToCanvas(
  point: { x: number; y: number },
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (point.x / 24) * width,
    y: (point.y / 24) * height,
  };
}

function buildSplitCrackBranchSegments(
  points: Array<{ x: number; y: number }>,
  width: number,
  height: number,
): string[] {
  const canvasPoints = points.map((point) =>
    mapSplitPointToCanvas(point, width, height),
  );
  const branchLength = Math.max(
    40,
    Math.round(Math.min(width, height) * 0.022),
  );

  return canvasPoints.flatMap((point, index) => {
    const previousPoint = canvasPoints[index - 1];
    const nextPoint = canvasPoints[index + 1];
    const referencePoint = nextPoint ?? previousPoint;

    if (!referencePoint) {
      return [];
    }

    const deltaX = referencePoint.x - point.x;
    const deltaY = referencePoint.y - point.y;
    const segmentLength = Math.hypot(deltaX, deltaY) || 1;
    const normalX = -deltaY / segmentLength;
    const normalY = deltaX / segmentLength;
    const direction = index % 2 === 0 ? 1 : -1;
    const startX = point.x + normalX * 12 * direction;
    const startY = point.y + normalY * 12 * direction;
    const midX = point.x + normalX * branchLength * 0.55 * direction;
    const midY = point.y + normalY * branchLength * 0.55 * direction;
    const endX = point.x + normalX * branchLength * direction;
    const endY = point.y + normalY * branchLength * direction;

    return [`${startX},${startY} ${midX},${midY} ${endX},${endY}`];
  });
}

function renderSplitDividerEffect({
  effect,
  width,
  height,
  scale,
  theme,
  points,
}: {
  effect: SplitBreakpointEffect;
  width: number;
  height: number;
  scale: number;
  theme: TemplateProps["theme"];
  points: Array<{ x: number; y: number }>;
}) {
  if (effect === "none") {
    return null;
  }

  const polylinePoints = buildSplitDividerPolylinePoints(points, width, height);

  if (effect === "opaque") {
    return (
      <svg
        data-template-region="intro-split-divider-opaque"
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="rgba(15, 23, 42, 0.82)"
          strokeWidth={Math.max(34, Math.round(38 * scale))}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={theme.textPrimary}
          strokeWidth={Math.max(18, Math.round(20 * scale))}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.92}
        />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={theme.accent}
          strokeWidth={Math.max(6, Math.round(7 * scale))}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.48}
        />
      </svg>
    );
  }

  if (effect === "cracked") {
    const crackBranchSegments = buildSplitCrackBranchSegments(
      points,
      width,
      height,
    );

    return (
      <svg
        data-template-region="intro-split-divider-cracked"
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="rgba(15, 23, 42, 0.88)"
          strokeWidth={Math.max(24, Math.round(26 * scale))}
          strokeLinejoin="miter"
          strokeLinecap="round"
        />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={theme.textPrimary}
          strokeWidth={Math.max(8, Math.round(10 * scale))}
          strokeLinejoin="miter"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(18, Math.round(20 * scale))} ${Math.max(10, Math.round(12 * scale))}`}
          opacity={0.95}
        />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={theme.accent}
          strokeWidth={Math.max(3, Math.round(4 * scale))}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.42}
        />
        {crackBranchSegments.map((segment, index) => (
          <polyline
            key={`${segment}-${index}`}
            data-template-region="intro-split-divider-crack-branch"
            points={segment}
            fill="none"
            stroke={theme.textPrimary}
            strokeWidth={Math.max(3, Math.round(4 * scale))}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.88}
          />
        ))}
      </svg>
    );
  }

  return (
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
        points={polylinePoints}
        fill="none"
        stroke="url(#intro-split-glass-gradient)"
        strokeWidth={Math.max(20, Math.round(24 * scale))}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.14}
        style={{ filter: `blur(${Math.max(4, Math.round(5 * scale))}px)` }}
      />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={theme.accent}
        strokeWidth={Math.max(10, Math.round(14 * scale))}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.08}
        style={{ filter: `blur(${Math.max(3, Math.round(4 * scale))}px)` }}
      />
    </svg>
  );
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
  const splitQuoteStyle = resolveSplitQuoteStyle(values["split_quote_style"]);
  const splitQuoteEnabled = isEnabled(values["split_quote_enabled"]);
  const splitQuoteBold = isEnabled(values["split_quote_bold"]);
  const splitQuoteText = values["split_quote_text"]?.trim() ?? "";
  const splitBreakpointEffect = resolveSplitBreakpointEffect(
    values["split_breakpoint_effect"],
  );
  const isCourseSplitType = splitTypeCapsuleValue === "course";
  const splitCourseTitle = values["split_course_title"]?.trim() ?? "";
  const hasSplitCourseTitle = splitCourseTitle.length > 0;
  const splitCourseLessonLabel = resolveCourseLessonLabel(
    values["split_course_lesson_current"],
    values["split_course_lesson_total"],
  );
  const titleSide = resolveTitleSide(values["split_title_side"]);
  const titleContentAlignment =
    titleSide === "left" ? "flex-start" : "flex-end";
  const splitTitleWidthPercent = resolveSplitTitleWidthPercent(
    values["split_title_width"],
  );
  const titleBlockOffsetY = resolveSplitTitleBlockOffsetPx(
    values["split_title_block_y"],
    height,
  );
  const splitQuoteWidthPercent = resolveSplitQuoteWidthPercent(
    values["split_quote_width"],
  );
  const splitQuoteTextScale = resolveSplitQuoteFontScale(
    values["split_quote_font_size"],
  );
  const splitQuoteMarkScale = resolveSplitQuoteMarkScale(
    values["split_quote_mark_size"],
  );
  const splitCourseBlockScale = resolveSplitCourseBlockScale(
    values["split_course_block_size"],
  );
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
  const courseBlockTextSize = Math.max(
    18,
    Math.round(splitTypeCapsuleSizing.textSize * scale * splitCourseBlockScale),
  );
  const courseMetaTextSize = Math.max(
    16,
    Math.round(courseBlockTextSize * 0.72),
  );
  const courseMetaGap = Math.max(8, Math.round(courseMetaTextSize * 0.28));
  const splitCourseTitleGapScale = resolveSplitCourseTitleGapScale(
    values["split_course_title_gap"],
  );
  const courseBlockMarginBottom = Math.max(
    8,
    Math.round(courseMetaTextSize * 1.75 * splitCourseTitleGapScale),
  );
  const courseRuleWidth = Math.max(
    160,
    Math.round(width * 0.176 * splitCourseBlockScale),
  );
  const titlePanelWidth = Math.round(width * (splitTitleWidthPercent / 100));
  const titlePanelHorizontalInset = Math.round(112 * scale);
  const splitQuoteWidthPx = Math.round(
    titlePanelWidth * (splitQuoteWidthPercent / 100),
  );
  const splitQuoteAnchorLeft =
    titleSide === "left"
      ? titlePanelHorizontalInset
      : width - titlePanelHorizontalInset - titlePanelWidth;
  const splitQuoteTextSize = Math.max(
    24,
    Math.round(SPLIT_QUOTE_TEXT_FONT_SIZE * splitQuoteTextScale),
  );
  const splitQuoteLineHeight = Math.max(
    splitQuoteTextSize,
    Math.round(SPLIT_QUOTE_LINE_GAP * splitQuoteTextScale),
  );
  const splitQuoteMarkSize = Math.max(
    40,
    Math.round(SPLIT_QUOTE_MARK_FONT_SIZE * splitQuoteMarkScale),
  );
  const splitQuoteMaxCharactersPerLine = Math.max(
    14,
    Math.round((splitQuoteWidthPx / splitQuoteTextSize) * 1.4),
  );
  const splitQuoteLines = wrapQuoteText(
    splitQuoteText,
    splitQuoteMaxCharactersPerLine,
  );
  const splitQuoteBlockHeight = Math.max(
    Math.round(
      (splitQuoteWidthPx * SPLIT_QUOTE_SVG_HEIGHT) / SPLIT_QUOTE_SVG_WIDTH,
    ),
    Math.round(
      ((SPLIT_QUOTE_TEXT_Y +
        Math.max(0, splitQuoteLines.length - 1) * splitQuoteLineHeight +
        splitQuoteTextSize) /
        SPLIT_QUOTE_SVG_WIDTH) *
        splitQuoteWidthPx,
    ),
  );
  const splitQuoteTop = resolveSplitQuoteTopPx(
    values["split_quote_y"],
    height,
    splitQuoteBlockHeight,
  );
  const splitQuoteOffsetX = resolveSplitQuoteOffsetPx(
    values["split_quote_x"],
    width,
    splitQuoteWidthPx,
    splitQuoteAnchorLeft,
  );
  const showSplitQuote =
    splitQuoteEnabled &&
    splitQuoteStyle === "size_1" &&
    splitQuoteLines.length > 0;
  const splitTypeCapsuleTextSize = Math.max(
    18,
    Math.round(splitTypeCapsuleSizing.textSize * scale),
  );
  const splitTypeCapsuleIconSize = Math.max(
    16,
    Math.round(splitTypeCapsuleTextSize * 1.25),
  );
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
  const splitTypeCapsuleSequence: ExtraThumbnailCapsule[] = [
    {
      key: "split-type",
      kind: "split-type",
      text: splitTypeCapsuleLabel,
      position: titleSide === "left" ? "top-left" : "top-right",
      color: theme.accent,
      icon: (
        <SplitTypeCapsuleIcon
          type={splitTypeCapsuleValue}
          size={splitTypeCapsuleIconSize}
          color={theme.accent}
        />
      ),
      order: 20,
    },
  ];

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
          padding: `0 ${titlePanelHorizontalInset}px`,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        {showSplitQuote && (
          <div
            data-template-region="intro-split-quote-anchor"
            style={{
              position: "absolute",
              top: `${splitQuoteTop}px`,
              width: `${titlePanelWidth}px`,
              maxWidth: `${splitTitleWidthPercent}%`,
              left:
                titleSide === "left"
                  ? `${titlePanelHorizontalInset}px`
                  : undefined,
              right:
                titleSide === "right"
                  ? `${titlePanelHorizontalInset}px`
                  : undefined,
              display: "flex",
              justifyContent: "flex-start",
              transform:
                splitQuoteOffsetX === 0
                  ? undefined
                  : `translateX(${splitQuoteOffsetX}px)`,
            }}
          >
            <div
              data-template-region="intro-split-quote-block"
              style={{
                width: `${splitQuoteWidthPercent}%`,
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <svg
                data-template-region="intro-split-quote-svg"
                viewBox={`0 0 ${SPLIT_QUOTE_SVG_WIDTH} ${SPLIT_QUOTE_SVG_HEIGHT}`}
                preserveAspectRatio={
                  titleSide === "left" ? "xMinYMin meet" : "xMaxYMin meet"
                }
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <text
                  data-template-region="intro-split-quote-text"
                  x={SPLIT_QUOTE_TEXT_X}
                  y={SPLIT_QUOTE_TEXT_Y}
                  fill={theme.textPrimary}
                  textAnchor="start"
                  style={{
                    fontFamily: primaryFont,
                    fontSize: `${splitQuoteTextSize}px`,
                    fontWeight: splitQuoteBold ? 700 : 500,
                  }}
                >
                  <tspan
                    x={SPLIT_QUOTE_MARK_X}
                    y={SPLIT_QUOTE_MARK_Y}
                    fontFamily="Georgia, serif"
                    fontSize={splitQuoteMarkSize}
                    fontWeight={700}
                    fill={theme.textSecondary}
                    textAnchor="start"
                  >
                    “
                  </tspan>
                  {splitQuoteLines.map((line, index) => (
                    <tspan
                      key={`intro-split-quote-line-${index}`}
                      x={SPLIT_QUOTE_TEXT_X}
                      dy={index === 0 ? 0 : splitQuoteLineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </svg>
            </div>
          </div>
        )}
        <div
          data-template-region="intro-split-title-panel"
          style={{
            width: `${titlePanelWidth}px`,
            maxWidth: `${splitTitleWidthPercent}%`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: titleContentAlignment,
            justifyContent: "center",
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
            data-template-region="intro-split-title-stack"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: titleContentAlignment,
              width: "100%",
              transform:
                titleBlockOffsetY === 0
                  ? undefined
                  : `translateY(${titleBlockOffsetY}px)`,
            }}
          >
            {isCourseSplitType && (
              <div
                data-template-region="intro-split-course-block"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: titleContentAlignment,
                  gap: Math.max(
                    10,
                    Math.round(10 * scale * splitCourseBlockScale),
                  ),
                  marginBottom: courseBlockMarginBottom,
                  textAlign: titleSide,
                  fontSize: courseBlockTextSize,
                  width: "100%",
                }}
              >
                <div
                  data-template-region="intro-split-course-meta"
                  style={{
                    color: theme.textSecondary,
                    fontFamily: secondaryFont,
                    fontWeight: 400,
                    fontSize: `${courseMetaTextSize}px`,
                    lineHeight: 1.08,
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      titleSide === "left" ? "flex-start" : "flex-end",
                    gap: courseMetaGap,
                    flexWrap: "wrap",
                    width: "100%",
                  }}
                >
                  {hasSplitCourseTitle && (
                    <span
                      data-template-region="intro-split-course-name"
                      style={{
                        fontWeight: 800,
                        textShadow: "0.012em 0 0 currentColor",
                      }}
                    >
                      {splitCourseTitle}
                    </span>
                  )}
                  {hasSplitCourseTitle && (
                    <span
                      data-template-region="intro-split-course-meta-divider"
                      style={{
                        fontWeight: 400,
                        opacity: 0.72,
                      }}
                    >
                      |
                    </span>
                  )}
                  <span
                    data-template-region="intro-split-course-progress"
                    style={{
                      fontWeight: 400,
                    }}
                  >
                    {splitCourseLessonLabel}
                  </span>
                </div>
                <div
                  data-template-region="intro-split-course-rule"
                  style={{
                    ...buildTemplateSeparatorStyle({
                      theme,
                      borderColor,
                      borderColorSecondary,
                      borderStyle,
                      scale,
                    }),
                    width: `${courseRuleWidth}px`,
                    maxWidth: "100%",
                    marginTop: 0,
                    marginBottom: 0,
                    alignSelf: titleSide === "left" ? "flex-start" : "flex-end",
                  }}
                />
              </div>
            )}
            <div
              data-template-region="intro-split-title-text"
              style={{
                color: theme.textPrimary,
                fontSize: titleSize,
                fontWeight: 820,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                fontFamily: isCourseSplitType ? primaryFont : secondaryFont,
                width: "100%",
                textAlign: titleSide,
              }}
            >
              {title}
            </div>
          </div>
        </div>
      </div>

      {renderSplitDividerEffect({
        effect: splitBreakpointEffect,
        width,
        height,
        scale,
        theme,
        points: splitPartition.points,
      })}

      <ThumbnailCapsules
        values={values}
        theme={theme}
        scale={scale}
        fontFamily={primaryFont}
        extraCapsules={splitTypeCapsuleSequence}
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
