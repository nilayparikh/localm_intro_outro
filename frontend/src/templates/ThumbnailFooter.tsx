interface ThumbnailFooterProps {
  width: number;
  color: string;
  fontSize: number;
  footerFontFamily: string;
  renderMode?: "full" | "hidden" | "only";
  text?: string;
}

export function ThumbnailFooter({
  width,
  color,
  fontSize,
  footerFontFamily,
  renderMode = "full",
  text,
}: ThumbnailFooterProps) {
  if (renderMode === "hidden") {
    return null;
  }

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
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </div>
  );
}