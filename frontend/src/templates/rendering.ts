export const REFERENCE_CANVAS = {
  width: 3840,
  height: 2160,
} as const;

export type GridPatternName =
  | "dots"
  | "grid"
  | "diagonal"
  | "cross"
  | "hexagon"
  | "circuit";

interface GridPatternBaseMetrics {
  tileWidth: number;
  tileHeight: number;
  dotRadius?: number;
  strokeWidth?: number;
  pointX?: number;
  pointY?: number;
}

export interface GridPatternMetrics extends GridPatternBaseMetrics {}

const GRID_PATTERN_BASE_METRICS: Record<
  GridPatternName,
  GridPatternBaseMetrics
> = {
  dots: {
    tileWidth: 112.5,
    tileHeight: 112.5,
    pointX: 56.25,
    pointY: 56.25,
    dotRadius: 7.5,
  },
  grid: {
    tileWidth: 150,
    tileHeight: 150,
    strokeWidth: 3.75,
  },
  diagonal: {
    tileWidth: 75,
    tileHeight: 75,
    strokeWidth: 3.75,
  },
  cross: {
    tileWidth: 112.5,
    tileHeight: 112.5,
    pointX: 56.25,
    pointY: 56.25,
    strokeWidth: 1.875,
  },
  hexagon: {
    tileWidth: 210,
    tileHeight: 375,
    strokeWidth: 3.75,
  },
  circuit: {
    tileWidth: 225,
    tileHeight: 225,
    strokeWidth: 3.75,
    pointX: 37.5,
    pointY: 37.5,
    dotRadius: 11.25,
  },
};

function scaleFromReference(canvasWidth: number, value: number): number {
  return value * (canvasWidth / REFERENCE_CANVAS.width);
}

function roundMetric(value: number): number {
  return Math.max(0, Math.round(value));
}

function roundStroke(value: number | undefined): number {
  if (!value) {
    return 0;
  }

  return Math.max(0.5, Number(value.toFixed(2)));
}

export function getGridPatternMetrics(
  pattern: GridPatternName,
  canvasWidth: number,
): GridPatternMetrics {
  const baseMetrics = GRID_PATTERN_BASE_METRICS[pattern];

  return {
    tileWidth: roundMetric(
      scaleFromReference(canvasWidth, baseMetrics.tileWidth),
    ),
    tileHeight: roundMetric(
      scaleFromReference(canvasWidth, baseMetrics.tileHeight),
    ),
    pointX:
      baseMetrics.pointX === undefined
        ? undefined
        : roundMetric(scaleFromReference(canvasWidth, baseMetrics.pointX)),
    pointY:
      baseMetrics.pointY === undefined
        ? undefined
        : roundMetric(scaleFromReference(canvasWidth, baseMetrics.pointY)),
    dotRadius:
      baseMetrics.dotRadius === undefined
        ? undefined
        : roundMetric(scaleFromReference(canvasWidth, baseMetrics.dotRadius)),
    strokeWidth: roundStroke(
      baseMetrics.strokeWidth === undefined
        ? undefined
        : scaleFromReference(canvasWidth, baseMetrics.strokeWidth),
    ),
  };
}

export function getScaledBorderWidth(
  canvasWidth: number,
  referenceBorderWidth: number,
): number {
  if (referenceBorderWidth <= 0) {
    return 0;
  }

  return Math.max(
    1,
    roundMetric(scaleFromReference(canvasWidth, referenceBorderWidth)),
  );
}
