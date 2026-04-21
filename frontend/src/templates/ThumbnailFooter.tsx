interface ThumbnailFooterProps {
  width: number;
  color: string;
  fontSize: number;
  footerFontFamily: string;
  renderMode?: "full" | "hidden" | "only";
  text?: string;
  size?: string;
}

type FooterSizePreset = "small" | "medium" | "large";

const FOOTER_SIZE_MULTIPLIERS: Record<FooterSizePreset, number> = {
  small: 0.28,
  medium: 0.34,
  large: 0.4,
};

const FOOTER_SPACING: Record<
  FooterSizePreset,
  { bottom: number; inset: number; marginTop: number }
> = {
  small: { bottom: 12, inset: 24, marginTop: 8 },
  medium: { bottom: 16, inset: 28, marginTop: 10 },
  large: { bottom: 20, inset: 32, marginTop: 12 },
};

export function resolveFooterSize(value: string | undefined): FooterSizePreset {
  if (value === "medium" || value === "large") {
    return value;
  }

  return "small";
}

export function ThumbnailFooter({
  width,
  color,
  fontSize,
  footerFontFamily,
  renderMode = "full",
  text,
  size,
}: ThumbnailFooterProps) {
  if (renderMode === "hidden") {
    return null;
  }

  const scale = width / 1280;
  const footerSize = resolveFooterSize(size);
  const spacing = FOOTER_SPACING[footerSize];
  const textSize = Math.round(
    fontSize * FOOTER_SIZE_MULTIPLIERS[footerSize] * scale,
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: Math.round(spacing.bottom * scale),
        left: Math.round(spacing.inset * scale),
        right: Math.round(spacing.inset * scale),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 4,
      }}
    >
      <div
        style={{
          marginTop: Math.round(spacing.marginTop * scale),
          color,
          fontFamily: footerFontFamily,
          fontSize: textSize,
          opacity: 0.72,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </div>
  );
}