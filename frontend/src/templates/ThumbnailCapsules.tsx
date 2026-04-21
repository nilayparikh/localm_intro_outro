import type { CSSProperties, ReactNode } from "react";
import {
  colorWithAlpha,
  resolveTemplateSurfaceStyle,
  type TemplateSurfaceStyle,
} from "./rendering";
import type { ThemeColors } from "./types";

type CapsulePosition = "top-left" | "top-right";
type CapsuleKind = "duration" | "level" | "instructor" | "hands-on-lab";
type CapsuleLevel = "beginner" | "intermediate" | "advanced" | "expert";
type CapsuleSizePreset = "small" | "medium" | "large";

interface CapsuleSizing {
  insetX: number;
  insetY: number;
  groupGap: number;
  capsuleGap: number;
  paddingY: number;
  paddingX: number;
  textSize: number;
  iconSize: number;
  dotSize: number;
  dotGlow: number;
  shadowY: number;
  shadowBlur: number;
}

interface CapsuleDescriptor {
  kind: CapsuleKind;
  text: string;
  position: CapsulePosition;
  color: string;
  icon: ReactNode;
}

const LEVEL_CONFIG: Record<CapsuleLevel, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "#34d399" },
  intermediate: { label: "Intermediate", color: "#fbbf24" },
  advanced: { label: "Advanced", color: "#60a5fa" },
  expert: { label: "Expert", color: "#f87171" },
};

const CAPSULE_SIZE_CONFIG = {
  small: {
    insetX: 40,
    insetY: 36,
    groupGap: 12,
    capsuleGap: 10,
    paddingY: 10,
    paddingX: 18,
    textSize: 18,
    iconSize: 18,
    dotSize: 10,
    dotGlow: 12,
    shadowY: 14,
    shadowBlur: 28,
  },
  medium: {
    insetX: 44,
    insetY: 40,
    groupGap: 14,
    capsuleGap: 12,
    paddingY: 12,
    paddingX: 22,
    textSize: 22,
    iconSize: 22,
    dotSize: 12,
    dotGlow: 14,
    shadowY: 16,
    shadowBlur: 32,
  },
  large: {
    insetX: 48,
    insetY: 44,
    groupGap: 16,
    capsuleGap: 14,
    paddingY: 14,
    paddingX: 26,
    textSize: 26,
    iconSize: 26,
    dotSize: 14,
    dotGlow: 16,
    shadowY: 18,
    shadowBlur: 36,
  },
} as const satisfies Record<CapsuleSizePreset, Omit<CapsuleSizing, never>>;

function isCapsuleEnabled(value: string | undefined): boolean {
  return value === "true";
}

function normalizeCapsuleText(value: string | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}

function normalizeLevel(value: string | undefined): CapsuleLevel {
  if (
    value === "intermediate" ||
    value === "advanced" ||
    value === "expert"
  ) {
    return value;
  }

  return "beginner";
}

function normalizeCapsuleColor(value: string | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}

function resolveCapsuleSize(value: string | undefined): CapsuleSizePreset {
  if (value === "medium" || value === "large") {
    return value;
  }

  return "small";
}

function buildCapsuleSizing(
  size: CapsuleSizePreset,
  scale: number,
): CapsuleSizing {
  const config = CAPSULE_SIZE_CONFIG[size];

  return {
    insetX: Math.round(config.insetX * scale),
    insetY: Math.round(config.insetY * scale),
    groupGap: Math.round(config.groupGap * scale),
    capsuleGap: Math.round(config.capsuleGap * scale),
    paddingY: Math.round(config.paddingY * scale),
    paddingX: Math.round(config.paddingX * scale),
    textSize: Math.round(config.textSize * scale),
    iconSize: Math.round(config.iconSize * scale),
    dotSize: Math.round(config.dotSize * scale),
    dotGlow: Math.round(config.dotGlow * scale),
    shadowY: Math.round(config.shadowY * scale),
    shadowBlur: Math.round(config.shadowBlur * scale),
  };
}

function ClockIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
      <path
        d="M12 7.8V12.2L15 14"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstructorIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8.5" r="3.5" stroke={color} strokeWidth="1.8" />
      <path
        d="M5.8 18.4C7.2 15.9 9.2 14.8 12 14.8C14.8 14.8 16.8 15.9 18.2 18.4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LabIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 3.8H15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.2 3.8V8.7L5.9 16.2C5.1 17.5 6 19.2 7.5 19.2H16.5C18 19.2 18.9 17.5 18.1 16.2L13.8 8.7V3.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 13.2C10.2 12.3 11.4 14.1 12.8 13.3C14 12.6 14.7 13.8 15.6 14.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildCapsules(
  values: Record<string, string>,
  sizing: CapsuleSizing,
): CapsuleDescriptor[] {
  const capsules: CapsuleDescriptor[] = [];
  const durationText = normalizeCapsuleText(values["duration_capsule_text"]);
  const instructorText = normalizeCapsuleText(values["instructor_capsule_text"]);
  const handsOnLabText = normalizeCapsuleText(
    values["hands_on_lab_capsule_text"],
  );
  const capsuleColor = normalizeCapsuleColor(values["capsule_color"]);

  if (isCapsuleEnabled(values["show_duration_capsule"]) && durationText) {
    const durationColor = capsuleColor ?? "#38bdf8";

    capsules.push({
      kind: "duration",
      text: durationText,
      position: "top-left",
      color: durationColor,
      icon: <ClockIcon size={sizing.iconSize} color={durationColor} />,
    });
  }

  if (isCapsuleEnabled(values["show_level_capsule"])) {
    const level = normalizeLevel(values["level_capsule_value"]);
    const config = LEVEL_CONFIG[level];
    const levelColor = capsuleColor ?? config.color;

    capsules.push({
      kind: "level",
      text: config.label,
      position: "top-right",
      color: levelColor,
      icon: (
        <span
          aria-hidden
          style={{
            width: sizing.dotSize,
            height: sizing.dotSize,
            borderRadius: 999,
            background: levelColor,
            boxShadow: `0 0 ${sizing.dotGlow}px ${colorWithAlpha(levelColor, 0.45)}`,
            display: "inline-block",
          }}
        />
      ),
    });
  }

  if (isCapsuleEnabled(values["show_instructor_capsule"]) && instructorText) {
    const instructorColor = capsuleColor ?? "#cbd5f5";

    capsules.push({
      kind: "instructor",
      text: instructorText,
      position: "top-right",
      color: instructorColor,
      icon: <InstructorIcon size={sizing.iconSize} color={instructorColor} />,
    });
  }

  if (
    isCapsuleEnabled(values["show_hands_on_lab_capsule"]) &&
    handsOnLabText
  ) {
    const handsOnLabColor = capsuleColor ?? "#f59e0b";

    capsules.push({
      kind: "hands-on-lab",
      text: handsOnLabText,
      position: "top-right",
      color: handsOnLabColor,
      icon: <LabIcon size={sizing.iconSize} color={handsOnLabColor} />,
    });
  }

  return capsules;
}

function buildGroupStyle({
  position,
  sizing,
}: {
  position: CapsulePosition;
  sizing: CapsuleSizing;
}): CSSProperties {
  return {
    position: "absolute",
    top: sizing.insetY,
    left: position === "top-left" ? sizing.insetX : undefined,
    right: position === "top-right" ? sizing.insetX : undefined,
    display: "flex",
    alignItems: "center",
    justifyContent: position === "top-right" ? "flex-end" : "flex-start",
    gap: sizing.groupGap,
    zIndex: 4,
  };
}

function buildCapsuleStyle({
  theme,
  accentColor,
  scale,
  sizing,
  stylePreset,
}: {
  theme: ThemeColors;
  accentColor: string;
  scale: number;
  sizing: CapsuleSizing;
  stylePreset: TemplateSurfaceStyle;
}): CSSProperties {
  if (stylePreset === "standard") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: sizing.capsuleGap,
      padding: `${sizing.paddingY}px ${sizing.paddingX}px`,
      borderRadius: Math.round(999 * scale),
      background: colorWithAlpha(accentColor, 0.22),
      border: `1px solid ${colorWithAlpha(accentColor, 0.52)}`,
      boxShadow: `0 ${Math.round(sizing.shadowY * 0.65)}px ${Math.round(sizing.shadowBlur * 0.75)}px ${colorWithAlpha(accentColor, 0.18)}`,
      color: theme.textPrimary,
      fontWeight: 700,
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    };
  }

  const isStrongGlass = stylePreset === "glass-strong";

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: sizing.capsuleGap,
    padding: `${sizing.paddingY}px ${sizing.paddingX}px`,
    borderRadius: Math.round(999 * scale),
    background: isStrongGlass
      ? `linear-gradient(145deg, ${colorWithAlpha(theme.surface, 0.76)}, ${colorWithAlpha(theme.background, 0.58)})`
      : `linear-gradient(145deg, ${colorWithAlpha(theme.surface, 0.62)}, ${colorWithAlpha(theme.background, 0.4)})`,
    border: `1px solid ${colorWithAlpha(accentColor, isStrongGlass ? 0.48 : 0.4)}`,
    boxShadow: `0 ${sizing.shadowY}px ${sizing.shadowBlur}px ${colorWithAlpha(theme.background, isStrongGlass ? 0.34 : 0.26)}`,
    backdropFilter: `blur(${isStrongGlass ? Math.round(24 * scale) : Math.round(16 * scale)}px) saturate(${isStrongGlass ? 165 : 145}%)`,
    color: theme.textPrimary,
    fontWeight: 700,
    letterSpacing: "0.03em",
    whiteSpace: "nowrap",
  };
}

export function ThumbnailCapsules({
  values,
  theme,
  scale,
  fontFamily,
}: {
  values: Record<string, string>;
  theme: ThemeColors;
  scale: number;
  fontFamily: string;
}) {
  const stylePreset = resolveTemplateSurfaceStyle(values["capsule_style"]);
  const sizing = buildCapsuleSizing(
    resolveCapsuleSize(values["capsule_size"]),
    scale,
  );
  const capsules = buildCapsules(values, sizing);
  const leftCapsules = capsules.filter(
    (capsule) => capsule.position === "top-left",
  );
  const rightCapsules = capsules.filter(
    (capsule) => capsule.position === "top-right",
  );

  if (leftCapsules.length === 0 && rightCapsules.length === 0) {
    return null;
  }

  return (
    <>
      {leftCapsules.length > 0 && (
        <div
          data-capsule-position="top-left"
          style={buildGroupStyle({ position: "top-left", sizing })}
        >
          {leftCapsules.map((capsule) => (
            <div
              key={capsule.kind}
              data-capsule-kind={capsule.kind}
              style={{
                ...buildCapsuleStyle({
                  theme,
                  accentColor: capsule.color,
                  scale,
                  sizing,
                  stylePreset,
                }),
                fontFamily,
                fontSize: sizing.textSize,
              }}
            >
              {capsule.icon}
              <span>{capsule.text}</span>
            </div>
          ))}
        </div>
      )}
      {rightCapsules.length > 0 && (
        <div
          data-capsule-position="top-right"
          style={buildGroupStyle({ position: "top-right", sizing })}
        >
          {rightCapsules.map((capsule) => (
            <div
              key={capsule.kind}
              data-capsule-kind={capsule.kind}
              style={{
                ...buildCapsuleStyle({
                  theme,
                  accentColor: capsule.color,
                  scale,
                  sizing,
                  stylePreset,
                }),
                fontFamily,
                fontSize: sizing.textSize,
              }}
            >
              {capsule.icon}
              <span>{capsule.text}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}