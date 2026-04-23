export type OutroArrowAssetType =
  | "full_video"
  | "subscribe"
  | "next_bite_size"
  | "course";

export interface OutroArrowOverlay {
  id: string;
  type: OutroArrowAssetType;
  text: string;
  x: number;
  y: number;
  degree: number;
  isInverse: boolean;
  textSize: number;
  arrowWidth: number;
  arrowHeight: number;
}

export interface OutroArrowVariantResource {
  viewBox: string;
  referenceWidth: number;
  referenceHeight: number;
  arrowPathD: string;
  textPathD: string;
  fontSize: number;
}

export interface OutroArrowAssetResource {
  id: OutroArrowAssetType;
  label: string;
  defaultText: string;
  strokeStart: string;
  strokeEnd: string;
  fillStart: string;
  fillEnd: string;
  regular: OutroArrowVariantResource;
  inverse: OutroArrowVariantResource;
}

const DEFAULT_OUTRO_ARROW_TYPE: OutroArrowAssetType = "subscribe";
const DEFAULT_OUTRO_ARROW_X = 72;
const DEFAULT_OUTRO_ARROW_Y = 68;
const DEFAULT_OUTRO_ARROW_TEXT_SIZE = 100;
const DEFAULT_OUTRO_ARROW_WIDTH = 100;
const DEFAULT_OUTRO_ARROW_HEIGHT = 100;
let outroArrowOverlayCounter = 0;

export const OUTRO_ARROW_ASSET_RESOURCES: Record<
  OutroArrowAssetType,
  OutroArrowAssetResource
> = {
  full_video: {
    id: "full_video",
    label: "Full Video Curve",
    defaultText: "FULL VIDEO",
    strokeStart: "#3b82f6",
    strokeEnd: "#8b5cf6",
    fillStart: "rgba(59, 130, 246, 0.35)",
    fillEnd: "rgba(139, 92, 246, 0.35)",
    regular: {
      viewBox: "40 180 245 190",
      referenceWidth: 245,
      referenceHeight: 190,
      arrowPathD:
        "M 140 225 L 140 190 L 50 250 L 140 310 L 140 275 Q 200 275 225 350 L 275 350 Q 250 225 140 225 Z",
      textPathD: "M 140 250 Q 225 250 250 350",
      fontSize: 40,
    },
    inverse: {
      viewBox: "45 440 245 180",
      referenceWidth: 245,
      referenceHeight: 180,
      arrowPathD:
        "M 190 575 L 190 610 L 280 550 L 190 490 L 190 525 Q 130 525 105 450 L 55 450 Q 80 575 190 575 Z",
      textPathD: "M 80 450 Q 105 550 180 550",
      fontSize: 40,
    },
  },
  subscribe: {
    id: "subscribe",
    label: "Subscribe Bar",
    defaultText: "SUBSCRIBE",
    strokeStart: "#ec4899",
    strokeEnd: "#f43f5e",
    fillStart: "rgba(236, 72, 153, 0.35)",
    fillEnd: "rgba(244, 63, 94, 0.35)",
    regular: {
      viewBox: "300 180 310 140",
      referenceWidth: 310,
      referenceHeight: 140,
      arrowPathD:
        "M 310 225 L 520 225 L 520 190 L 600 250 L 520 310 L 520 275 L 310 275 Z",
      textPathD: "M 320 250 L 510 250",
      fontSize: 40,
    },
    inverse: {
      viewBox: "260 480 310 140",
      referenceWidth: 310,
      referenceHeight: 140,
      arrowPathD:
        "M 560 575 L 350 575 L 350 610 L 270 550 L 350 490 L 350 525 L 560 525 Z",
      textPathD: "M 360 550 L 550 550",
      fontSize: 40,
    },
  },
  next_bite_size: {
    id: "next_bite_size",
    label: "Next Bite-Size Bar",
    defaultText: "NEXT BITE-SIZE",
    strokeStart: "#10b981",
    strokeEnd: "#06b6d4",
    fillStart: "rgba(16, 185, 129, 0.35)",
    fillEnd: "rgba(6, 182, 212, 0.35)",
    regular: {
      viewBox: "620 180 350 140",
      referenceWidth: 350,
      referenceHeight: 140,
      arrowPathD:
        "M 630 225 L 880 225 L 880 190 L 960 250 L 880 310 L 880 275 L 630 275 Z",
      textPathD: "M 640 250 L 870 250",
      fontSize: 40,
    },
    inverse: {
      viewBox: "580 480 350 140",
      referenceWidth: 350,
      referenceHeight: 140,
      arrowPathD:
        "M 920 575 L 670 575 L 670 610 L 590 550 L 670 490 L 670 525 L 920 525 Z",
      textPathD: "M 680 550 L 910 550",
      fontSize: 40,
    },
  },
  course: {
    id: "course",
    label: "Course Curve",
    defaultText: "COURSE",
    strokeStart: "#f59e0b",
    strokeEnd: "#ef4444",
    fillStart: "rgba(245, 158, 11, 0.35)",
    fillEnd: "rgba(239, 68, 68, 0.35)",
    regular: {
      viewBox: "1020 180 240 180",
      referenceWidth: 240,
      referenceHeight: 180,
      arrowPathD:
        "M 1030 350 Q 1055 225 1160 225 L 1160 190 L 1250 250 L 1160 310 L 1160 275 Q 1100 275 1090 350 Z",
      textPathD: "M 1060 350 Q 1077 250 1150 250",
      fontSize: 40,
    },
    inverse: {
      viewBox: "1010 440 250 180",
      referenceWidth: 250,
      referenceHeight: 180,
      arrowPathD:
        "M 1250 450 Q 1225 575 1120 575 L 1120 610 L 1030 550 L 1120 490 L 1120 525 Q 1180 525 1190 450 Z",
      textPathD: "M 1130 550 Q 1203 550 1220 450",
      fontSize: 40,
    },
  },
};

export const OUTRO_ARROW_TYPE_OPTIONS = Object.values(
  OUTRO_ARROW_ASSET_RESOURCES,
).map((asset) => ({
  value: asset.id,
  label: asset.label,
}));

function isOutroArrowAssetType(value: unknown): value is OutroArrowAssetType {
  return typeof value === "string" && value in OUTRO_ARROW_ASSET_RESOURCES;
}

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.round(Math.min(maximum, Math.max(minimum, value)));
}

function getNextOutroArrowOverlayId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  outroArrowOverlayCounter += 1;
  return `outro-arrow-${Date.now()}-${outroArrowOverlayCounter}`;
}

export function createDefaultOutroArrowOverlay(
  type: OutroArrowAssetType = DEFAULT_OUTRO_ARROW_TYPE,
): OutroArrowOverlay {
  const asset = OUTRO_ARROW_ASSET_RESOURCES[type];

  return {
    id: getNextOutroArrowOverlayId(),
    type,
    text: asset.defaultText,
    x: DEFAULT_OUTRO_ARROW_X,
    y: DEFAULT_OUTRO_ARROW_Y,
    degree: 0,
    isInverse: false,
    textSize: DEFAULT_OUTRO_ARROW_TEXT_SIZE,
    arrowWidth: DEFAULT_OUTRO_ARROW_WIDTH,
    arrowHeight: DEFAULT_OUTRO_ARROW_HEIGHT,
  };
}

export function normalizeOutroArrowOverlays(
  overlays: unknown,
): OutroArrowOverlay[] {
  if (!Array.isArray(overlays)) {
    return [];
  }

  return overlays.reduce<OutroArrowOverlay[]>((normalized, overlay, index) => {
    if (!overlay || typeof overlay !== "object") {
      return normalized;
    }

    const candidate = overlay as Partial<OutroArrowOverlay>;
    const type = isOutroArrowAssetType(candidate.type)
      ? candidate.type
      : DEFAULT_OUTRO_ARROW_TYPE;
    const asset = OUTRO_ARROW_ASSET_RESOURCES[type];
    const legacyArrowSize = clampNumber(
      (overlay as { arrowSize?: unknown }).arrowSize,
      25,
      250,
      DEFAULT_OUTRO_ARROW_WIDTH,
    );

    normalized.push({
      id:
        typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id.trim()
          : `outro-arrow-${index + 1}`,
      type,
      text:
        typeof candidate.text === "string" && candidate.text.trim().length > 0
          ? candidate.text.trim()
          : asset.defaultText,
      x: clampNumber(candidate.x, 0, 100, DEFAULT_OUTRO_ARROW_X),
      y: clampNumber(candidate.y, 0, 100, DEFAULT_OUTRO_ARROW_Y),
      degree: clampNumber(candidate.degree, 0, 360, 0),
      isInverse: candidate.isInverse === true,
      textSize: clampNumber(
        candidate.textSize,
        25,
        300,
        DEFAULT_OUTRO_ARROW_TEXT_SIZE,
      ),
      arrowWidth: clampNumber(candidate.arrowWidth, 25, 250, legacyArrowSize),
      arrowHeight: clampNumber(candidate.arrowHeight, 25, 250, legacyArrowSize),
    });

    return normalized;
  }, []);
}
