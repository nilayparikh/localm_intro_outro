import { useCallback, useState } from "react";
import { getFontEmbedCSS, toCanvas } from "html-to-image";
import * as FileSaver from "file-saver";
import JSZip from "jszip";
import toast from "react-hot-toast";
import { LOCAL_FONT_EMBED_CSS } from "../styles/exportFontEmbedCss";

interface ExportOptions {
  transparent?: boolean;
  quality?: number;
}

interface MotionExportOptions extends ExportOptions {
  durationSeconds?: number;
  audioUrl?: string | null;
}

interface StillFrameWebmPlan {
  width: number;
  height: number;
  durationMs: number;
  frameRate: number;
}

interface StillFrameMp4ArgsOptions {
  imageInputName: string;
  audioInputName?: string;
  outputName: string;
  durationSeconds: number;
  width: number;
  height: number;
  frameRate: number;
  videoCodec?: "libx264" | "mpeg4";
}

interface FfmpegLoadConfig {
  coreURL?: string;
  wasmURL?: string;
  workerURL?: string;
  classWorkerURL?: string;
}

interface FfmpegInstance {
  loaded: boolean;
  load(config?: FfmpegLoadConfig): Promise<boolean>;
  exec(args: string[], timeout?: number): Promise<number>;
  writeFile(path: string, data: Uint8Array | string): Promise<boolean>;
  readFile(path: string): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<boolean>;
}

interface MotionFfmpegContext {
  ffmpeg: FfmpegInstance;
  fetchFile: (input: Blob | File | string) => Promise<Uint8Array>;
}

type CaptureElement = Pick<HTMLElement, "scrollWidth" | "scrollHeight">;
type MimeTypeSupportChecker = (type: string) => boolean;
type MotionFileExtension = "mp4" | "webm";
export type ExportAction = "png" | "zip" | "motion";
export type ExportActivityState = Record<ExportAction, number>;

const IDLE_EXPORT_ACTIVITY_STATE: ExportActivityState = {
  png: 0,
  zip: 0,
  motion: 0,
};

const MP4_MIME_TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1.4D401E,mp4a.40.2",
  "video/mp4;codecs=h264,aac",
  "video/mp4",
] as const;

const WEBM_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;
const MOTION_MIME_TYPES = [...MP4_MIME_TYPES, ...WEBM_MIME_TYPES] as const;
const STILL_FRAME_WEBM_FRAME_RATE = 30;
const EXPORT_SUPERSAMPLE_SCALE = 2;
const FOUR_K_MIN_DIMENSION = 2160;
const MIN_WEBM_VIDEO_BITS_PER_SECOND = 6_000_000;
const MAX_WEBM_VIDEO_BITS_PER_SECOND = 48_000_000;
const MOTION_AUDIO_BITS_PER_SECOND = 192_000;
let cachedRemoteFontStylesheetTextPromise: Promise<string> | null = null;
let cachedMotionFfmpegPromise: Promise<MotionFfmpegContext> | null = null;
let cachedAntiBandingNoiseTile: HTMLCanvasElement | null = null;

interface Mp4QualitySettings {
  preset: "slow" | "medium";
  crf: number;
  maxrate: string;
  bufsize: string;
  profile: "high";
  level: string;
}

function getCaptureDimensions(element?: CaptureElement | null) {
  const width = element?.scrollWidth ?? 0;
  const height = element?.scrollHeight ?? 0;

  if (width <= 0 || height <= 0) {
    return {};
  }

  return {
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
  };
}

export function buildCaptureOptions(
  options: ExportOptions = {},
  element?: CaptureElement | null,
) {
  return {
    quality: options.quality ?? 1,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
    cacheBust: true,
    preferredFontFormat: "woff2",
    ...getCaptureDimensions(element),
  };
}

export function buildSupersampledCaptureOptions(
  options: ExportOptions = {},
  element?: CaptureElement | null,
  supersampleScale = EXPORT_SUPERSAMPLE_SCALE,
) {
  const baseOptions = buildCaptureOptions(options, element);
  const width = element?.scrollWidth ?? 0;
  const height = element?.scrollHeight ?? 0;
  const scale = Math.max(1, Math.round(supersampleScale));

  if (width <= 0 || height <= 0 || scale === 1) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    canvasWidth: width * scale,
    canvasHeight: height * scale,
  };
}

export function resolveSupersampleScaleForDimensions(
  width: number,
  height: number,
): number {
  return Math.max(width, height) >= FOUR_K_MIN_DIMENSION
    ? 1
    : EXPORT_SUPERSAMPLE_SCALE;
}

export function buildStillFrameWebmPlan(
  element: CaptureElement,
  durationSeconds: number,
): StillFrameWebmPlan {
  return {
    width: Math.max(0, Math.round(element.scrollWidth || 0)),
    height: Math.max(0, Math.round(element.scrollHeight || 0)),
    durationMs: Math.max(1, Math.round(durationSeconds * 1000)),
    frameRate: STILL_FRAME_WEBM_FRAME_RATE,
  };
}

export function resolveSupportedWebmMimeType(
  isTypeSupported?: MimeTypeSupportChecker,
): string | null {
  if (!isTypeSupported) {
    return null;
  }

  return WEBM_MIME_TYPES.find((type) => isTypeSupported(type)) ?? null;
}

export function resolveSupportedMotionMimeType(
  isTypeSupported?: MimeTypeSupportChecker,
): string | null {
  if (!isTypeSupported) {
    return null;
  }

  return MOTION_MIME_TYPES.find((type) => isTypeSupported(type)) ?? null;
}

export function resolveMotionFileExtension(
  mimeType: string | null,
): MotionFileExtension {
  if (mimeType?.startsWith("video/mp4")) {
    return "mp4";
  }

  return "webm";
}

function resolveRemoteFontStylesheetUrls(doc: Document): string[] {
  return Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),
  )
    .map((link) => link.href)
    .filter((href) => href.includes("fonts.googleapis.com/css"));
}

async function getRemoteFontStylesheetText(
  doc: Document = document,
): Promise<string> {
  const stylesheetUrls = resolveRemoteFontStylesheetUrls(doc);

  if (stylesheetUrls.length === 0) {
    return "";
  }

  if (!cachedRemoteFontStylesheetTextPromise) {
    cachedRemoteFontStylesheetTextPromise = Promise.all(
      stylesheetUrls.map(async (url) => {
        const response = await fetch(url, { cache: "force-cache" });

        if (!response.ok) {
          throw new Error(`Failed to load font stylesheet: ${url}`);
        }

        return response.text();
      }),
    ).then((stylesheets) => stylesheets.join("\n"));
  }

  return cachedRemoteFontStylesheetTextPromise;
}

async function buildFontEmbedCss(
  element: HTMLElement,
): Promise<string | undefined> {
  const sandboxDocument =
    document.implementation.createHTMLDocument("export-font-embed");
  const localStyle = sandboxDocument.createElement("style");

  localStyle.textContent = LOCAL_FONT_EMBED_CSS;
  sandboxDocument.head.appendChild(localStyle);

  try {
    const remoteStylesheetText = await getRemoteFontStylesheetText(
      element.ownerDocument,
    );

    if (remoteStylesheetText.trim()) {
      const remoteStyle = sandboxDocument.createElement("style");

      remoteStyle.textContent = remoteStylesheetText;
      sandboxDocument.head.appendChild(remoteStyle);
    }

    const clonedElement = element.cloneNode(true) as HTMLElement;

    sandboxDocument.body.appendChild(clonedElement);

    return await getFontEmbedCSS(clonedElement, {
      preferredFontFormat: "woff2",
    });
  } catch (error) {
    console.warn("Falling back to default html-to-image font capture", error);
    return undefined;
  }
}

export function resolveStillFrameWebmBitrate(plan: StillFrameWebmPlan): number {
  const estimatedBitsPerSecond = Math.round(plan.width * plan.height * 5);

  return Math.min(
    MAX_WEBM_VIDEO_BITS_PER_SECOND,
    Math.max(MIN_WEBM_VIDEO_BITS_PER_SECOND, estimatedBitsPerSecond),
  );
}

function formatMotionDurationSeconds(durationSeconds: number): string {
  const normalizedDuration = Math.max(
    0.1,
    Math.round(Math.max(0, durationSeconds) * 1000) / 1000,
  );

  if (Number.isInteger(normalizedDuration)) {
    return `${normalizedDuration}`;
  }

  return normalizedDuration.toFixed(3).replace(/\.?0+$/, "");
}

function resolveRequestedMotionFileExtension(
  filename: string,
): MotionFileExtension {
  return filename.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
}

function resolveMotionAssetExtension(
  source: string,
  contentType?: string | null,
  fallback = "bin",
): string {
  const pathname = source.split("?")[0] ?? source;
  const pathnameMatch = pathname.match(/\.([a-z0-9]+)$/i);
  const matchedExtension = pathnameMatch?.[1];

  if (matchedExtension) {
    return matchedExtension.toLowerCase();
  }

  const normalizedType = contentType?.split(";")[0]?.trim().toLowerCase();

  switch (normalizedType) {
    case "audio/mpeg":
      return "mp3";
    case "audio/mp4":
    case "video/mp4":
      return "mp4";
    case "audio/webm":
    case "video/webm":
      return "webm";
    case "audio/wav":
      return "wav";
    case "audio/ogg":
    case "video/ogg":
      return "ogg";
    default:
      return fallback;
  }
}

function createMotionTempFilePrefix(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function markExportActionStarted(
  currentState: ExportActivityState,
  action: ExportAction,
): ExportActivityState {
  return {
    ...currentState,
    [action]: currentState[action] + 1,
  };
}

function markExportActionFinished(
  currentState: ExportActivityState,
  action: ExportAction,
): ExportActivityState {
  return {
    ...currentState,
    [action]: Math.max(0, currentState[action] - 1),
  };
}

function hasActiveExports(activityState: ExportActivityState): boolean {
  return Object.values(activityState).some((count) => count > 0);
}

export function buildStillFrameMp4Args({
  imageInputName,
  audioInputName,
  outputName,
  durationSeconds,
  width,
  height,
  frameRate,
  videoCodec = "libx264",
}: StillFrameMp4ArgsOptions): string[] {
  const sanitizedWidth = Math.max(2, Math.round(width));
  const sanitizedHeight = Math.max(2, Math.round(height));
  const sanitizedFrameRate = Math.max(1, Math.round(frameRate));
  const durationArg = formatMotionDurationSeconds(durationSeconds);
  const qualitySettings = resolveStillFrameMp4QualitySettings(
    sanitizedWidth,
    sanitizedHeight,
  );
  const videoArgs =
    videoCodec === "mpeg4"
      ? ["-c:v", "mpeg4", "-q:v", "2"]
      : [
          "-c:v",
          "libx264",
          "-preset",
          qualitySettings.preset,
          "-tune",
          "stillimage",
          "-crf",
          `${qualitySettings.crf}`,
          "-maxrate",
          qualitySettings.maxrate,
          "-bufsize",
          qualitySettings.bufsize,
          "-profile:v",
          qualitySettings.profile,
          "-level:v",
          qualitySettings.level,
        ];

  return [
    "-loop",
    "1",
    "-framerate",
    `${sanitizedFrameRate}`,
    "-i",
    imageInputName,
    ...(audioInputName ? ["-i", audioInputName] : []),
    "-t",
    durationArg,
    "-vf",
    `scale=${sanitizedWidth}:${sanitizedHeight}:flags=lanczos,format=yuv420p`,
    ...videoArgs,
    "-pix_fmt",
    "yuv420p",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    ...(audioInputName
      ? ["-af", `apad=whole_dur=${durationArg}`, "-c:a", "aac", "-b:a", "192k"]
      : []),
    "-movflags",
    "+faststart",
    ...(audioInputName ? [] : ["-an"]),
    outputName,
  ];
}

function resolveStillFrameMp4QualitySettings(
  width: number,
  height: number,
): Mp4QualitySettings {
  if (Math.max(width, height) >= FOUR_K_MIN_DIMENSION) {
    return {
      preset: "slow",
      crf: 12,
      maxrate: "80M",
      bufsize: "160M",
      profile: "high",
      level: "5.2",
    };
  }

  return {
    preset: "medium",
    crf: 14,
    maxrate: "40M",
    bufsize: "80M",
    profile: "high",
    level: "4.2",
  };
}

async function loadMotionFfmpeg(): Promise<MotionFfmpegContext> {
  if (!cachedMotionFfmpegPromise) {
    cachedMotionFfmpegPromise = (async () => {
      const [
        ffmpegModule,
        utilModule,
        coreUrlModule,
        wasmUrlModule,
        classWorkerUrlModule,
      ] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
        import("@ffmpeg/core?url"),
        import("@ffmpeg/core/wasm?url"),
        import("@ffmpeg/ffmpeg/worker?url"),
      ]);
      const ffmpeg = new ffmpegModule.FFmpeg() as FfmpegInstance;

      await ffmpeg.load({
        coreURL: coreUrlModule.default,
        wasmURL: wasmUrlModule.default,
        classWorkerURL: classWorkerUrlModule.default,
      });

      return {
        ffmpeg,
        fetchFile: utilModule.fetchFile as MotionFfmpegContext["fetchFile"],
      };
    })().catch((error) => {
      cachedMotionFfmpegPromise = null;
      throw error;
    });
  }

  return cachedMotionFfmpegPromise;
}

async function recordStillFrameMp4(
  sourceCanvas: HTMLCanvasElement,
  plan: StillFrameWebmPlan,
  audioUrl?: string | null,
): Promise<Blob> {
  const { ffmpeg, fetchFile } = await loadMotionFfmpeg();
  const tempFilePrefix = createMotionTempFilePrefix();
  const imageInputName = `${tempFilePrefix}-frame.png`;
  const outputName = `${tempFilePrefix}-motion.mp4`;
  const tempPaths = [imageInputName, outputName];

  try {
    const imageBlob = await canvasToBlob(sourceCanvas, "image/png");
    await ffmpeg.writeFile(imageInputName, await fetchFile(imageBlob));

    let audioInputName: string | undefined;

    if (audioUrl) {
      const audioResponse = await fetch(audioUrl, { cache: "force-cache" });

      if (!audioResponse.ok) {
        throw new Error(
          "Failed to load the selected audio track for MP4 export.",
        );
      }

      const audioBlob = await audioResponse.blob();
      const audioExtension = resolveMotionAssetExtension(
        audioUrl,
        audioResponse.headers.get("content-type"),
        "bin",
      );
      audioInputName = `${tempFilePrefix}-audio.${audioExtension}`;
      tempPaths.push(audioInputName);
      await ffmpeg.writeFile(audioInputName, await fetchFile(audioBlob));
    }

    const mp4ArgsOptions = {
      imageInputName,
      audioInputName,
      outputName,
      durationSeconds: plan.durationMs / 1000,
      width: plan.width,
      height: plan.height,
      frameRate: plan.frameRate,
    } satisfies StillFrameMp4ArgsOptions;

    let exitCode = await ffmpeg.exec(buildStillFrameMp4Args(mp4ArgsOptions));

    if (exitCode !== 0) {
      exitCode = await ffmpeg.exec(
        buildStillFrameMp4Args({
          ...mp4ArgsOptions,
          videoCodec: "mpeg4",
        }),
      );
    }

    if (exitCode !== 0) {
      throw new Error("FFmpeg failed to encode the motion MP4 export.");
    }

    const outputData = await ffmpeg.readFile(outputName);
    const outputBytes =
      outputData instanceof Uint8Array
        ? outputData
        : new TextEncoder().encode(outputData);

    return new Blob([outputBytes], { type: "video/mp4" });
  } finally {
    await Promise.allSettled(
      tempPaths.map(async (path) => {
        try {
          await ffmpeg.deleteFile(path);
        } catch {
          // Ignore temp file cleanup failures between exports.
        }
      }),
    );
  }
}

function drawStillFrame(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
) {
  const context = targetCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to prepare motion export canvas.");
  }

  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  context.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    targetCanvas.width,
    targetCanvas.height,
  );
}

function getAntiBandingNoiseTile(): HTMLCanvasElement {
  if (cachedAntiBandingNoiseTile) {
    return cachedAntiBandingNoiseTile;
  }

  const noiseTile = document.createElement("canvas");
  noiseTile.width = 96;
  noiseTile.height = 96;
  const context = noiseTile.getContext("2d");

  if (!context) {
    cachedAntiBandingNoiseTile = noiseTile;
    return noiseTile;
  }

  const imageData = context.createImageData(noiseTile.width, noiseTile.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const noise = Math.floor(Math.random() * 256);
    data[index] = noise;
    data[index + 1] = noise;
    data[index + 2] = noise;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  cachedAntiBandingNoiseTile = noiseTile;
  return noiseTile;
}

function applySubtleAntiBandingNoise(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const noiseTile = getAntiBandingNoiseTile();
  const pattern = context.createPattern(noiseTile, "repeat");

  if (!pattern) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "soft-light";
  context.globalAlpha = 0.035;
  context.fillStyle = pattern;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function downsampleCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  if (
    sourceCanvas.width === targetWidth &&
    sourceCanvas.height === targetHeight
  ) {
    return sourceCanvas;
  }

  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;

  const context = targetCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to prepare export canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return targetCanvas;
}

async function renderExportCanvas(
  element: HTMLElement,
  options: ExportOptions = {},
): Promise<HTMLCanvasElement> {
  const outputWidth = Math.max(0, Math.round(element.scrollWidth || 0));
  const outputHeight = Math.max(0, Math.round(element.scrollHeight || 0));
  const supersampleScale = resolveSupersampleScaleForDimensions(
    outputWidth,
    outputHeight,
  );
  const fontEmbedCSS = await buildFontEmbedCss(element);

  const captureCanvas = await toCanvas(element, {
    ...buildSupersampledCaptureOptions(options, element, supersampleScale),
    ...(fontEmbedCSS ? { fontEmbedCSS } : {}),
  });

  if (outputWidth <= 0 || outputHeight <= 0) {
    return captureCanvas;
  }

  return downsampleCanvas(captureCanvas, outputWidth, outputHeight);
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode export canvas."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function recordStillFrameWebm(
  sourceCanvas: HTMLCanvasElement,
  plan: StillFrameWebmPlan,
  audioUrl?: string | null,
): Promise<{ blob: Blob; mimeType: string | null }> {
  const MediaRecorderCtor = globalThis.MediaRecorder;
  if (!MediaRecorderCtor) {
    throw new Error("Motion export is not supported in this browser.");
  }

  const recordingCanvas = document.createElement("canvas");
  recordingCanvas.width = plan.width;
  recordingCanvas.height = plan.height;
  drawStillFrame(sourceCanvas, recordingCanvas);

  const videoStream = recordingCanvas.captureStream(plan.frameRate);
  const mimeType = resolveSupportedMotionMimeType(
    MediaRecorderCtor.isTypeSupported?.bind(MediaRecorderCtor),
  );
  const videoBitsPerSecond = resolveStillFrameWebmBitrate(plan);
  const AudioContextCtor =
    globalThis.AudioContext ??
    (
      globalThis as typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  let audioContext: AudioContext | null = null;
  let audioElement: HTMLAudioElement | null = null;
  let audioSourceNode: MediaElementAudioSourceNode | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;

  if (audioUrl && AudioContextCtor) {
    audioElement = document.createElement("audio");
    audioElement.preload = "auto";
    audioElement.src = audioUrl;
    audioElement.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      const handleReady = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(
          new Error("Failed to load the selected audio track for export."),
        );
      };
      const cleanup = () => {
        audioElement?.removeEventListener("loadedmetadata", handleReady);
        audioElement?.removeEventListener("error", handleError);
      };

      if ((audioElement?.readyState ?? 0) >= HTMLMediaElement.HAVE_METADATA) {
        resolve();
        return;
      }

      audioElement?.addEventListener("loadedmetadata", handleReady, {
        once: true,
      });
      audioElement?.addEventListener("error", handleError, { once: true });
    });

    audioContext = new AudioContextCtor();
    audioSourceNode = audioContext.createMediaElementSource(audioElement);
    audioDestination = audioContext.createMediaStreamDestination();
    audioSourceNode.connect(audioDestination);
  }

  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...(audioDestination?.stream.getAudioTracks() ?? []),
  ]);
  const recorder = mimeType
    ? new MediaRecorderCtor(stream, {
        mimeType,
        videoBitsPerSecond,
        ...(audioDestination
          ? { audioBitsPerSecond: MOTION_AUDIO_BITS_PER_SECOND }
          : {}),
      })
    : new MediaRecorderCtor(stream, {
        videoBitsPerSecond,
        ...(audioDestination
          ? { audioBitsPerSecond: MOTION_AUDIO_BITS_PER_SECOND }
          : {}),
      });
  const chunks: BlobPart[] = [];
  const frameIntervalMs = Math.max(50, Math.round(1000 / plan.frameRate));

  return await new Promise<{ blob: Blob; mimeType: string | null }>(
    (resolve, reject) => {
      const intervalId = window.setInterval(() => {
        try {
          drawStillFrame(sourceCanvas, recordingCanvas);
        } catch (error) {
          window.clearInterval(intervalId);
          stream.getTracks().forEach((track) => track.stop());
          reject(error);
        }
      }, frameIntervalMs);

      const cleanup = () => {
        window.clearInterval(intervalId);
        stream.getTracks().forEach((track) => track.stop());
        audioElement?.pause();
        audioElement = null;
        audioSourceNode?.disconnect();
        audioDestination = null;
        audioSourceNode = null;
        if (audioContext) {
          void audioContext.close();
          audioContext = null;
        }
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onerror = () => {
        cleanup();
        reject(new Error("Motion export failed while recording."));
      };
      recorder.onstop = () => {
        cleanup();
        resolve({
          blob: new Blob(chunks, { type: mimeType ?? "video/webm" }),
          mimeType,
        });
      };

      recorder.start(250);

      if (audioElement && audioContext) {
        void (async () => {
          try {
            await audioContext.resume();
            audioElement.currentTime = 0;
            await audioElement.play();
          } catch (error) {
            cleanup();
            reject(error);
          }
        })();
      }

      window.setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, plan.durationMs);
    },
  );
}

async function waitForDocumentFonts(doc: Document = document): Promise<void> {
  const fontFaceSet = (
    doc as Document & {
      fonts?: { ready?: Promise<unknown> };
    }
  ).fonts;

  if (!fontFaceSet?.ready) {
    return;
  }

  try {
    await fontFaceSet.ready;
  } catch {
    // Fall back to capture if the browser font API does not settle cleanly.
  }
}

export function useExport() {
  const [activeExportActions, setActiveExportActions] =
    useState<ExportActivityState>(IDLE_EXPORT_ACTIVITY_STATE);

  const exportPng = useCallback(
    async (
      element: HTMLElement,
      filename: string,
      options: ExportOptions = {},
    ) => {
      setActiveExportActions((currentState) =>
        markExportActionStarted(currentState, "png"),
      );
      try {
        await waitForDocumentFonts();
        const canvas = await renderExportCanvas(element, options);
        const blob = await canvasToBlob(canvas, "image/png", options.quality);
        FileSaver.saveAs(blob, filename);

        toast.success(`Exported ${filename}`);
      } catch (err) {
        console.error("Export failed:", err);
        toast.error("Export failed");
      } finally {
        setActiveExportActions((currentState) =>
          markExportActionFinished(currentState, "png"),
        );
      }
    },
    [],
  );

  const exportZip = useCallback(
    async (
      items: { element: HTMLElement; filename: string }[],
      zipName: string,
      options: ExportOptions = {},
    ) => {
      setActiveExportActions((currentState) =>
        markExportActionStarted(currentState, "zip"),
      );
      try {
        const zip = new JSZip();
        await waitForDocumentFonts();

        for (const item of items) {
          const canvas = await renderExportCanvas(item.element, options);
          const blob = await canvasToBlob(canvas, "image/png", options.quality);
          zip.file(item.filename, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        FileSaver.saveAs(zipBlob, zipName);

        toast.success(`Exported ${zipName} with ${items.length} files`);
      } catch (err) {
        console.error("ZIP export failed:", err);
        toast.error("ZIP export failed");
      } finally {
        setActiveExportActions((currentState) =>
          markExportActionFinished(currentState, "zip"),
        );
      }
    },
    [],
  );

  const exportMotion = useCallback(
    async (
      element: HTMLElement,
      filename: string,
      options: MotionExportOptions = {},
    ) => {
      setActiveExportActions((currentState) =>
        markExportActionStarted(currentState, "motion"),
      );
      try {
        await waitForDocumentFonts();
        const stillFrameCanvas = await renderExportCanvas(element, options);
        applySubtleAntiBandingNoise(stillFrameCanvas);
        const plan = buildStillFrameWebmPlan(
          element,
          options.durationSeconds ?? 3,
        );

        if (plan.width <= 0 || plan.height <= 0) {
          throw new Error("Motion export requires a non-empty canvas.");
        }

        const baseFilename = filename.replace(/\.[^.]+$/, "");
        const requestedExtension =
          resolveRequestedMotionFileExtension(filename);
        let resolvedFilename = `${baseFilename}.${requestedExtension}`;
        let blob: Blob;

        if (requestedExtension === "mp4") {
          try {
            blob = await recordStillFrameMp4(
              stillFrameCanvas,
              plan,
              options.audioUrl,
            );
          } catch (ffmpegError) {
            console.warn(
              "Falling back to browser motion export after FFmpeg MP4 failed.",
              ffmpegError,
            );

            const recordedMotion = await recordStillFrameWebm(
              stillFrameCanvas,
              plan,
              options.audioUrl,
            );
            const fileExtension = resolveMotionFileExtension(
              recordedMotion.mimeType,
            );

            resolvedFilename = `${baseFilename}.${fileExtension}`;
            blob = recordedMotion.blob;
          }
        } else {
          const recordedMotion = await recordStillFrameWebm(
            stillFrameCanvas,
            plan,
            options.audioUrl,
          );
          const fileExtension = resolveMotionFileExtension(
            recordedMotion.mimeType,
          );

          resolvedFilename = `${baseFilename}.${fileExtension}`;
          blob = recordedMotion.blob;
        }

        FileSaver.saveAs(blob, resolvedFilename);
        toast.success(`Exported ${resolvedFilename}`);
      } catch (err) {
        console.error("Motion export failed:", err);
        toast.error("Motion export failed");
      } finally {
        setActiveExportActions((currentState) =>
          markExportActionFinished(currentState, "motion"),
        );
      }
    },
    [],
  );

  return {
    exportMotion,
    exportPng,
    exportZip,
    activeExportActions,
    isExporting: hasActiveExports(activeExportActions),
  };
}
