import test from "node:test";
import assert from "node:assert/strict";
import { buildThumbnailTemplateRenderProps } from "../../src/pages/thumbnailSettings";

test("buildThumbnailTemplateRenderProps preserves export-sensitive asset and typography settings", () => {
  const props = buildThumbnailTemplateRenderProps({
    width: 3840,
    height: 2160,
    values: {
      title: "Context Engineering",
      show_duration_capsule: "true",
      duration_capsule_text: "10 min",
      show_level_capsule: "true",
      level_capsule_value: "intermediate",
      show_instructor_capsule: "true",
      instructor_capsule_text: "Instructor Led",
    },
    theme: {
      background: "#0b1120",
      surface: "#111827",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      accent: "#22d3ee",
      borderColor: "#22d3ee",
      gradientStart: "#0b1120",
      gradientMid: "#111827",
      gradientEnd: "#1e293b",
      backgroundImage: "linear-gradient(135deg, #0b1120, #111827, #1e293b)",
    },
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    borderWidth: 24,
    borderColor: "#22d3ee",
    brandLogoUrl: null,
    brandLogoSize: 90,
    tutorialImageUrl: "data:image/png;base64,preview-image",
    tutorialImageSize: 125,
    tutorialImageBottomPadding: 36,
    tutorialImageOpacity: 82,
    socialAccounts: {
      x_twitter: "@localm_tuts",
      youtube: "LocalM Tuts",
    },
    showCopyrightMessage: true,
    copyrightText: "© 2026 LocalM™",
  });

  assert.equal(props.width, 3840);
  assert.equal(props.height, 2160);
  assert.equal(props.values.duration_capsule_text, "10 min");
  assert.equal(props.values.level_capsule_value, "intermediate");
  assert.equal(props.values.instructor_capsule_text, "Instructor Led");
  assert.equal(props.primaryFontFamily, "'Outfit', sans-serif");
  assert.equal(props.secondaryFontFamily, "'Share Tech Mono', monospace");
  assert.equal(props.tutorialImageUrl, "data:image/png;base64,preview-image");
  assert.equal(props.tutorialImageSize, 125);
  assert.equal(props.tutorialImageBottomPadding, 36);
  assert.equal(props.tutorialImageOpacity, 82);
  assert.deepEqual(props.socialAccounts, {
    x_twitter: "@localm_tuts",
    youtube: "LocalM Tuts",
  });
  assert.equal(props.socialRenderMode, "full");
  assert.equal(props.borderWidth, 24);
  assert.equal(props.borderColor, "#22d3ee");
});

test("buildThumbnailTemplateRenderProps hides footer social rendering when copyright is off", () => {
  const props = buildThumbnailTemplateRenderProps({
    width: 3840,
    height: 2160,
    values: {},
    theme: {
      background: "#0b1120",
      surface: "#111827",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      accent: "#22d3ee",
      borderColor: "#22d3ee",
      gradientStart: "#0b1120",
      gradientMid: "#111827",
      gradientEnd: "#1e293b",
      backgroundImage: "linear-gradient(135deg, #0b1120, #111827, #1e293b)",
    },
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    borderWidth: 0,
    borderColor: "#22d3ee",
    brandLogoUrl: null,
    brandLogoSize: 90,
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 24,
    tutorialImageOpacity: 100,
    showCopyrightMessage: false,
    copyrightText: "© 2026 LocalM™",
  });

  assert.equal(props.socialRenderMode, "hidden");
});

test("buildThumbnailTemplateRenderProps preserves intro and outro static field values for exports", () => {
  const props = buildThumbnailTemplateRenderProps({
    width: 3840,
    height: 2160,
    values: {
      title: "Thank You for Watching",
      subtitle: "Please subscribe for more bite-sized lessons",
      cta_text: "Subscribe",
      intro_audio_asset_id: "asset-intro-sting",
      outro_audio_asset_id: "asset-outro-sting",
      source_label: "BITE FROM",
      source_title: "Context Engineering for GitHub Copilot",
      show_bite_capsule: "true",
      bite_capsule_text: "BITE",
      show_speed_capsule: "true",
      speed_capsule_text: "Fast",
    },
    theme: {
      background: "#0b1120",
      surface: "#111827",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      accent: "#22d3ee",
      borderColor: "#22d3ee",
      gradientStart: "#0b1120",
      gradientMid: "#111827",
      gradientEnd: "#1e293b",
      backgroundImage: "linear-gradient(135deg, #0b1120, #111827, #1e293b)",
    },
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    borderWidth: 24,
    borderColor: "#22d3ee",
    brandLogoUrl: null,
    brandLogoSize: 90,
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 24,
    tutorialImageOpacity: 100,
    showCopyrightMessage: true,
    copyrightText: "© 2026 LocalM™",
  });

  assert.equal(props.values.intro_audio_asset_id, "asset-intro-sting");
  assert.equal(props.values.outro_audio_asset_id, "asset-outro-sting");
  assert.equal(props.values.source_label, "BITE FROM");
  assert.equal(
    props.values.source_title,
    "Context Engineering for GitHub Copilot",
  );
  assert.equal(props.values.bite_capsule_text, "BITE");
  assert.equal(props.values.speed_capsule_text, "Fast");
});

test("buildThumbnailTemplateRenderProps preserves structured outro arrow overlays for rendering", () => {
  const props = buildThumbnailTemplateRenderProps({
    width: 3840,
    height: 2160,
    values: {
      title: "Thank You for Watching",
      subtitle: "Want more? Subscribe and press the bell",
    },
    theme: {
      background: "#0b1120",
      surface: "#111827",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      accent: "#22d3ee",
      borderColor: "#22d3ee",
      gradientStart: "#0b1120",
      gradientMid: "#111827",
      gradientEnd: "#1e293b",
      backgroundImage: "linear-gradient(135deg, #0b1120, #111827, #1e293b)",
    },
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    borderWidth: 24,
    borderColor: "#22d3ee",
    brandLogoUrl: null,
    brandLogoSize: 90,
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 24,
    tutorialImageOpacity: 100,
    ...({
      outroArrowOverlays: [
        {
          id: "arrow-1",
          type: "subscribe",
          text: "SUBSCRIBE",
          x: 42,
          y: 68,
          degree: 0,
          isInverse: false,
          textSize: 118,
          arrowSize: 136,
          isBold: true,
          isItalic: true,
          thickness: "thick",
        },
      ],
    } as any),
    showCopyrightMessage: true,
    copyrightText: "© 2026 LocalM™",
  } as any);

  assert.deepEqual((props as any).outroArrowOverlays, [
    {
      id: "arrow-1",
      type: "subscribe",
      text: "SUBSCRIBE",
      x: 42,
      y: 68,
      degree: 0,
      isInverse: false,
      textSize: 118,
      arrowSize: 136,
      isBold: true,
      isItalic: true,
      thickness: "thick",
    },
  ]);
});
