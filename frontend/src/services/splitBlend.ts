import {
  ImageMagick,
  MagickFormat,
  initializeImageMagick,
} from "@imagemagick/magick-wasm";
import magickWasmUrl from "@imagemagick/magick-wasm/magick.wasm?url";
import type { ThemeColors } from "../templates/types";

let magickInitPromise: Promise<void> | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function ensureImageMagickReady(): Promise<void> {
  if (!magickInitPromise) {
    magickInitPromise = initializeImageMagick(
      new URL(magickWasmUrl, window.location.href),
    );
  }

  await magickInitPromise;
}

async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load split image"));
    image.src = url;
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to convert split blend"));
    reader.readAsDataURL(blob);
  });
}

async function bytesToDataUrl(
  bytes: Uint8Array,
  mimeType: string,
): Promise<string> {
  return await blobToDataUrl(new Blob([bytes], { type: mimeType }));
}

export async function buildSplitBlendBackground({
  foregroundImageUrl,
  theme,
  width = 3840,
  height = 2160,
  mode = "export",
}: {
  foregroundImageUrl: string;
  theme: ThemeColors;
  width?: number;
  height?: number;
  mode?: "preview" | "export";
}): Promise<string | null> {
  if (!foregroundImageUrl?.trim()) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, theme.gradientStart || theme.background);
  gradient.addColorStop(0.5, theme.gradientMid || theme.surface);
  gradient.addColorStop(1, theme.gradientEnd || theme.background);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  try {
    const image = await loadImageFromUrl(foregroundImageUrl);

    context.save();
    context.globalAlpha = 0.34;
    context.filter = `blur(${Math.round(width * 0.012)}px) saturate(130%)`;
    context.drawImage(
      image,
      -Math.round(width * 0.06),
      -Math.round(height * 0.04),
      Math.round(width * 1.12),
      Math.round(height * 1.1),
    );
    context.restore();

    context.save();
    context.globalAlpha = 0.2;
    const accentGradient = context.createRadialGradient(
      width * 0.72,
      height * 0.22,
      width * 0.06,
      width * 0.72,
      height * 0.22,
      width * 0.62,
    );
    accentGradient.addColorStop(0, theme.accent);
    accentGradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = accentGradient;
    context.fillRect(0, 0, width, height);
    context.restore();

    if (mode === "preview") {
      return canvas.toDataURL("image/png");
    }

    try {
      await ensureImageMagickReady();

      const bytes = ImageMagick.readFromCanvas(canvas, (magickImage) => {
        magickImage.resize(width, height);
        magickImage.blur(0, 2.4);
        magickImage.sharpen(0, 0.75);

        return magickImage.write(
          MagickFormat.Png,
          (data) => new Uint8Array(data),
        );
      });

      return await bytesToDataUrl(bytes, "image/png");
    } catch {
      return canvas.toDataURL("image/png");
    }
  } catch {
    return null;
  }
}

export function clampSplitBackgroundOpacity(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? "55");
  if (!Number.isFinite(parsed)) {
    return 55;
  }

  return clamp(parsed, 0, 100);
}
