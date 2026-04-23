import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCaptureOptions,
  buildStillFrameMp4Args,
  buildSupersampledCaptureOptions,
  buildStillFrameWebmPlan,
  resolveSupersampleScaleForDimensions,
  resolveMotionFileExtension,
  resolveSupportedMotionMimeType,
  resolveStillFrameWebmBitrate,
  resolveSupportedWebmMimeType,
} from "../../src/hooks/useExport";

test("buildCaptureOptions keeps fonts enabled so export text matches preview wrapping", () => {
  assert.deepEqual(buildCaptureOptions(), {
    quality: 1,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
    cacheBust: true,
    preferredFontFormat: "woff2",
  });
});

test("buildCaptureOptions keeps explicit quality overrides", () => {
  assert.deepEqual(buildCaptureOptions({ quality: 0.75 }), {
    quality: 0.75,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
    cacheBust: true,
    preferredFontFormat: "woff2",
  });
});

test("buildCaptureOptions locks export dimensions to the rendered canvas size", () => {
  const element = {
    scrollWidth: 1280,
    scrollHeight: 720,
  } as HTMLElement;

  assert.deepEqual(buildCaptureOptions({}, element), {
    quality: 1,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
    cacheBust: true,
    preferredFontFormat: "woff2",
    width: 1280,
    height: 720,
    canvasWidth: 1280,
    canvasHeight: 720,
  });
});

test("buildSupersampledCaptureOptions renders a larger internal canvas while preserving the export size", () => {
  const element = {
    scrollWidth: 1280,
    scrollHeight: 720,
  } as HTMLElement;

  assert.deepEqual(buildSupersampledCaptureOptions({}, element), {
    quality: 1,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
    cacheBust: true,
    preferredFontFormat: "woff2",
    width: 1280,
    height: 720,
    canvasWidth: 2560,
    canvasHeight: 1440,
  });
});

test("resolveSupersampleScaleForDimensions disables supersampling at 4K and keeps it for lower resolutions", () => {
  assert.equal(resolveSupersampleScaleForDimensions(3840, 2160), 1);
  assert.equal(resolveSupersampleScaleForDimensions(1280, 720), 2);
});

test("buildStillFrameWebmPlan locks WEBM export to the selected resolution and configured duration", () => {
  const element = {
    scrollWidth: 3840,
    scrollHeight: 2160,
  } as HTMLElement;

  assert.deepEqual(buildStillFrameWebmPlan(element, 5), {
    width: 3840,
    height: 2160,
    durationMs: 5000,
    frameRate: 30,
  });
});

test("resolveStillFrameWebmBitrate scales bitrate high enough for 4K still-frame exports", () => {
  assert.equal(
    resolveStillFrameWebmBitrate({
      width: 3840,
      height: 2160,
      durationMs: 5000,
      frameRate: 30,
    }),
    41472000,
  );
});

test("resolveSupportedWebmMimeType prefers the first supported WEBM codec", () => {
  assert.equal(
    resolveSupportedWebmMimeType(
      (type) => type === "video/webm;codecs=vp8" || type === "video/webm",
    ),
    "video/webm;codecs=vp8",
  );
});

test("resolveSupportedWebmMimeType returns null when WEBM recording is unavailable", () => {
  assert.equal(
    resolveSupportedWebmMimeType(() => false),
    null,
  );
});

test("resolveSupportedMotionMimeType prefers MP4 before WEBM when both are available", () => {
  assert.equal(
    resolveSupportedMotionMimeType(
      (type) =>
        type === "video/mp4;codecs=avc1.42E01E,mp4a.40.2" ||
        type === "video/webm;codecs=vp9",
    ),
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  );
});

test("resolveMotionFileExtension returns mp4 for MP4 recordings and webm otherwise", () => {
  assert.equal(
    resolveMotionFileExtension("video/mp4;codecs=avc1.42E01E,mp4a.40.2"),
    "mp4",
  );
  assert.equal(resolveMotionFileExtension("video/webm;codecs=vp9"), "webm");
  assert.equal(resolveMotionFileExtension(null), "webm");
});

test("buildStillFrameMp4Args creates a deterministic still-frame MP4 command without audio", () => {
  assert.deepEqual(
    buildStillFrameMp4Args({
      imageInputName: "frame.png",
      outputName: "motion.mp4",
      durationSeconds: 5,
      width: 3840,
      height: 2160,
      frameRate: 30,
    }),
    [
      "-loop",
      "1",
      "-framerate",
      "30",
      "-i",
      "frame.png",
      "-t",
      "5",
      "-vf",
      "scale=3840:2160:flags=lanczos,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-tune",
      "stillimage",
      "-crf",
      "12",
      "-maxrate",
      "80M",
      "-bufsize",
      "160M",
      "-profile:v",
      "high",
      "-level:v",
      "5.2",
      "-pix_fmt",
      "yuv420p",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-movflags",
      "+faststart",
      "-an",
      "motion.mp4",
    ],
  );
});

test("buildStillFrameMp4Args muxes selected audio into the still-frame MP4 export", () => {
  assert.deepEqual(
    buildStillFrameMp4Args({
      imageInputName: "frame.png",
      audioInputName: "audio.mp3",
      outputName: "motion.mp4",
      durationSeconds: 5,
      width: 3840,
      height: 2160,
      frameRate: 30,
    }),
    [
      "-loop",
      "1",
      "-framerate",
      "30",
      "-i",
      "frame.png",
      "-i",
      "audio.mp3",
      "-t",
      "5",
      "-vf",
      "scale=3840:2160:flags=lanczos,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-tune",
      "stillimage",
      "-crf",
      "12",
      "-maxrate",
      "80M",
      "-bufsize",
      "160M",
      "-profile:v",
      "high",
      "-level:v",
      "5.2",
      "-pix_fmt",
      "yuv420p",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-af",
      "apad=whole_dur=5",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      "motion.mp4",
    ],
  );
});
