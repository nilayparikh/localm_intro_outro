import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { TutorialThumbnailTemplate } from "../../src/templates/TutorialThumbnailTemplate";
import { CenteredCourseThumbnailTemplate } from "../../src/templates/CenteredCourseThumbnailTemplate";
import type { TemplateProps } from "../../src/templates/types";

const baseProps: TemplateProps = {
  width: 3840,
  height: 2160,
  values: {
    title: "Context Engineering",
    subtitle: "Plan Mode Deep Dive",
    badge: "Tutorial",
    episode: "EP 08",
    show_grid: "true",
    grid_pattern: "dots",
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
  fontSize: 96,
  socialAccounts: {},
  socialPosition: "center",
  borderWidth: 24,
  borderColor: "#22d3ee",
  overlayImageUrl: null,
  overlayImageSize: 100,
  tutorialImageUrl: null,
  tutorialImageSize: 100,
  tutorialImageBottomPadding: 24,
  tutorialImageOpacity: 100,
  brandLogoUrl: null,
  brandLogoSize: 90,
  copyrightText: "© 2026 LocalM™",
};

test("tutorial template uses theme secondary text color for badge metadata and subtitle", () => {
  const html = renderToStaticMarkup(
    <TutorialThumbnailTemplate {...baseProps} />,
  );

  const badgeSnippet =
    html.match(/<div style="[^"]*">Tutorial • EP 08<\/div>/)?.[0] ?? "";
  const subtitleSnippet =
    html.match(/<div style="[^"]*">Plan Mode Deep Dive<\/div>/)?.[0] ?? "";

  assert.match(html, /Plan Mode Deep Dive/);
  assert.match(html, /Tutorial • EP 08/);
  assert.match(badgeSnippet, /color:#94a3b8/);
  assert.doesNotMatch(badgeSnippet, /background:#22d3ee/);
  assert.match(subtitleSnippet, /color:#94a3b8/);
});

test("centered course template uses theme secondary text color for badge and episode metadata", () => {
  const html = renderToStaticMarkup(
    <CenteredCourseThumbnailTemplate {...baseProps} />,
  );

  const metadataSnippet =
    html.match(/<div style="[^"]*">Tutorial \| EP 08<\/div>/)?.[0] ?? "";

  assert.match(html, /Tutorial \| EP 08/);
  assert.match(metadataSnippet, /color:#94a3b8/);
  assert.doesNotMatch(metadataSnippet, /color:#22d3ee/);
});