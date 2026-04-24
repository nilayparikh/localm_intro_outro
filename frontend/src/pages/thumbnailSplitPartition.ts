export interface SplitPartitionPoint {
  x: number;
  y: number;
}

export const SPLIT_PARTITION_MIN = 0;
export const SPLIT_PARTITION_MAX = 24;
export const MAX_SPLIT_BREAKPOINTS = 24;

export const DEFAULT_SPLIT_PARTITION_POINTS: SplitPartitionPoint[] = [
  { x: 12, y: 3 },
  { x: 12, y: 24 },
];

interface SplitPartitionSuccess {
  ok: true;
  points: SplitPartitionPoint[];
}

interface SplitPartitionFailure {
  ok: false;
  error: string;
}

export type SplitPartitionParseResult =
  | SplitPartitionSuccess
  | SplitPartitionFailure;

const POINT_TOKEN_REGEX =
  /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;

function clampCoordinate(value: number): number {
  return Math.min(SPLIT_PARTITION_MAX, Math.max(SPLIT_PARTITION_MIN, value));
}

function roundCoordinate(value: number): number {
  return Number.parseFloat(value.toFixed(2));
}

function isBoundedValue(value: number): boolean {
  return value >= SPLIT_PARTITION_MIN && value <= SPLIT_PARTITION_MAX;
}

function formatCoordinate(value: number): string {
  const roundedValue = roundCoordinate(clampCoordinate(value));
  return Number.isInteger(roundedValue)
    ? String(Math.trunc(roundedValue))
    : String(roundedValue);
}

function sortPointsByY(points: SplitPartitionPoint[]): SplitPartitionPoint[] {
  return [...points].sort((left, right) => left.y - right.y);
}

function normalizePoint(point: SplitPartitionPoint): SplitPartitionPoint {
  return {
    x: roundCoordinate(clampCoordinate(point.x)),
    y: roundCoordinate(clampCoordinate(point.y)),
  };
}

function toPercent(gridValue: number): number {
  return (gridValue / SPLIT_PARTITION_MAX) * 100;
}

function toPercentToken(value: number): string {
  return `${value.toFixed(2)}%`;
}

function distanceToSegment(
  point: SplitPartitionPoint,
  segmentStart: SplitPartitionPoint,
  segmentEnd: SplitPartitionPoint,
): number {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) /
        (dx * dx + dy * dy),
    ),
  );
  const projectionX = segmentStart.x + t * dx;
  const projectionY = segmentStart.y + t * dy;

  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

export function sortSplitPartitionPoints(
  points: SplitPartitionPoint[],
): SplitPartitionPoint[] {
  return sortPointsByY(points.map(normalizePoint));
}

export function resolveSplitDividerPercentPoints(
  points: SplitPartitionPoint[],
): SplitPartitionPoint[] {
  const sortedPoints = sortSplitPartitionPoints(points);
  const firstPoint = sortedPoints[0] ?? DEFAULT_SPLIT_PARTITION_POINTS[0]!;
  const lastPoint =
    sortedPoints[sortedPoints.length - 1] ??
    DEFAULT_SPLIT_PARTITION_POINTS[DEFAULT_SPLIT_PARTITION_POINTS.length - 1]!;

  return [
    { x: toPercent(firstPoint.x), y: 0 },
    ...sortedPoints.map((point) => ({
      x: toPercent(point.x),
      y: toPercent(point.y),
    })),
    { x: toPercent(lastPoint.x), y: 100 },
  ];
}

export function buildSplitDividerPolylinePoints(
  points: SplitPartitionPoint[],
  width: number,
  height: number,
): string {
  return resolveSplitDividerPercentPoints(points)
    .map(
      (point) =>
        `${((point.x / 100) * width).toFixed(2)},${((point.y / 100) * height).toFixed(2)}`,
    )
    .join(" ");
}

export function resolveSplitPolygons(points: SplitPartitionPoint[]): {
  left: string;
  right: string;
  dividerPercentPoints: SplitPartitionPoint[];
} {
  const dividerPercentPoints = resolveSplitDividerPercentPoints(points);
  const dividerLine = dividerPercentPoints
    .map((point) => `${toPercentToken(point.x)} ${toPercentToken(point.y)}`)
    .join(", ");

  return {
    left: `0% 0%, ${dividerLine}, 0% 100%`,
    right: `100% 0%, ${[...dividerPercentPoints]
      .reverse()
      .map((point) => `${toPercentToken(point.x)} ${toPercentToken(point.y)}`)
      .join(", ")}, 100% 100%`,
    dividerPercentPoints,
  };
}

export function getSplitDividerDistancePx(
  points: SplitPartitionPoint[],
  width: number,
  height: number,
  targetX: number,
  targetY: number,
): number {
  const dividerPixels = resolveSplitDividerPercentPoints(points).map((point) => ({
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  }));

  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < dividerPixels.length - 1; index += 1) {
    const start = dividerPixels[index];
    const end = dividerPixels[index + 1];

    if (!start || !end) {
      continue;
    }

    minDistance = Math.min(
      minDistance,
      distanceToSegment({ x: targetX, y: targetY }, start, end),
    );
  }

  return minDistance;
}

export function serializeSplitPartitionPoints(
  points: SplitPartitionPoint[],
): string {
  return sortSplitPartitionPoints(points)
    .map((point) => `(${formatCoordinate(point.x)}, ${formatCoordinate(point.y)})`)
    .join(", ");
}

export function insertSplitBreakpoint(
  points: SplitPartitionPoint[],
  newPoint: SplitPartitionPoint,
): SplitPartitionPoint[] {
  if (points.length >= MAX_SPLIT_BREAKPOINTS) {
    return sortSplitPartitionPoints(points);
  }

  return sortSplitPartitionPoints([...points, normalizePoint(newPoint)]);
}

export function updateSplitBreakpoint(
  points: SplitPartitionPoint[],
  index: number,
  axis: "x" | "y",
  value: number,
): SplitPartitionPoint[] {
  if (index < 0 || index >= points.length) {
    return sortSplitPartitionPoints(points);
  }

  const nextPoints = points.map((point, pointIndex) => {
    if (pointIndex !== index) {
      return normalizePoint(point);
    }

    const normalizedValue = roundCoordinate(clampCoordinate(value));
    return normalizePoint({
      ...point,
      [axis]: normalizedValue,
    });
  });

  return sortSplitPartitionPoints(nextPoints);
}

export function removeSplitBreakpoint(
  points: SplitPartitionPoint[],
  index: number,
): SplitPartitionPoint[] {
  if (points.length <= 2) {
    return sortSplitPartitionPoints(points);
  }

  if (index < 0 || index >= points.length) {
    return sortSplitPartitionPoints(points);
  }

  return sortSplitPartitionPoints(
    points.filter((_, pointIndex) => pointIndex !== index),
  );
}

export function parseSplitPartitionPoints(
  input: string,
): SplitPartitionParseResult {
  const normalizedInput = input.trim();
  if (!normalizedInput) {
    return {
      ok: false,
      error: "Use format: (x1, y1), (x2, y2)",
    };
  }

  const matches = [...normalizedInput.matchAll(POINT_TOKEN_REGEX)];
  if (matches.length < 2) {
    return {
      ok: false,
      error: "Add at least two points in format: (x1, y1), (x2, y2)",
    };
  }

  if (matches.length > MAX_SPLIT_BREAKPOINTS) {
    return {
      ok: false,
      error: `Add at most ${MAX_SPLIT_BREAKPOINTS} points.`,
    };
  }

  const compactInput = normalizedInput.replace(/\s+/g, "");
  const reconstructedInput = matches
    .map((match) => `(${match[1]},${match[2]})`)
    .join(",");

  if (compactInput !== reconstructedInput) {
    return {
      ok: false,
      error: "Invalid format. Use: (x1, y1), (x2, y2)",
    };
  }

  const points: SplitPartitionPoint[] = [];

  for (const [, xRaw, yRaw] of matches) {
    if (!xRaw || !yRaw) {
      return {
        ok: false,
        error: "Invalid format. Use: (x1, y1), (x2, y2)",
      };
    }

    const x = Number.parseFloat(xRaw);
    const y = Number.parseFloat(yRaw);

    if (!isBoundedValue(x) || !isBoundedValue(y)) {
      return {
        ok: false,
        error: `Each coordinate must be between ${SPLIT_PARTITION_MIN} and ${SPLIT_PARTITION_MAX}.`,
      };
    }

    points.push(normalizePoint({ x, y }));
  }

  points.sort((left, right) => left.y - right.y);

  return {
    ok: true,
    points,
  };
}

export function resolveSplitPartitionPoints(input: string): {
  points: SplitPartitionPoint[];
  error: string | null;
} {
  const parsed = parseSplitPartitionPoints(input);

  if (!parsed.ok) {
    return {
      points: DEFAULT_SPLIT_PARTITION_POINTS,
      error: parsed.error,
    };
  }

  return {
    points: parsed.points,
    error: null,
  };
}
