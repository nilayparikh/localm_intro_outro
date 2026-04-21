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