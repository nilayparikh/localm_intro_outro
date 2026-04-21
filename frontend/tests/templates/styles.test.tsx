import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CenteredThumbnailTemplate } from "../../src/templates/CenteredThumbnailTemplate";
import { TutorialThumbnailTemplate } from "../../src/templates/TutorialThumbnailTemplate";
import { CenteredCourseThumbnailTemplate } from "../../src/templates/CenteredCourseThumbnailTemplate";
import {
  buildTemplateFrameStyle,
  buildTemplatePanelStyle,
} from "../../src/templates/rendering";
import type { TemplateProps } from "../../src/templates/types";

const baseTheme = {
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
} as const;

const baseProps: TemplateProps = {
  width: 3840,
  height: 2160,
  values: {
    title: "Context Engineering",
    subtitle: "Plan Mode Deep Dive",
    badge: "Tutorial",
    episode: "EP 08",
    title_size: "lg",
    secondary_size: "md",
    surface_style: "standard",
    border_style: "solid",
    show_grid: "true",
    grid_pattern: "dots",
  },
  theme: baseTheme,
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

test("tutorial template supports larger secondary text and glass styling", () => {
  const html = renderToStaticMarkup(
    <TutorialThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        secondary_size: "xl",
        surface_style: "glass",
        border_style: "gradient",
      }}
    />,
  );

  const subtitleSnippet =
    html.match(/<div style="[^"]*">Plan Mode Deep Dive<\/div>/)?.[0] ?? "";

  assert.match(subtitleSnippet, /font-size:259px/);
  assert.match(html, /backdrop-filter:blur\(/);
  assert.match(html, /border-image-source:linear-gradient\(/);
});

test("gradient borders stay inside the frame and use both configured border colors", () => {
  const style = buildTemplateFrameStyle({
    width: 3840,
    height: 2160,
    fontFamily: "'Outfit', sans-serif",
    theme: baseTheme,
    borderWidth: 24,
    borderColor: "#22d3ee",
    borderColorSecondary: "#f59e0b",
    borderStyle: "gradient",
  });

  assert.equal(style.boxSizing, "border-box");
  assert.equal(
    style.borderImageSource,
    "linear-gradient(135deg, #22d3ee, #f59e0b)",
  );
  assert.equal(style.borderImageSlice, 1);
});

test("panel shadows can be pushed farther from the title surface", () => {
  const style = buildTemplatePanelStyle({
    surfaceStyle: "glass",
    theme: baseTheme,
    scale: 3,
    shadowStyle: "distance",
  });

  assert.match(String(style.boxShadow), /0 66px 192px rgba\(11, 17, 32,/);
});

test("centered course metadata honors secondary text size scaling", () => {
  const html = renderToStaticMarkup(
    <CenteredCourseThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        secondary_size: "xl",
      }}
    />,
  );

  const metadataSnippet =
    html.match(/<div style="[^"]*">Tutorial \| EP 08<\/div>/)?.[0] ?? "";

  assert.match(metadataSnippet, /font-size:194px/);
});

test("centered course renders a faded separator line using the selected border styling", () => {
  const html = renderToStaticMarkup(
    <CenteredCourseThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        border_style: "gradient",
      }}
    />,
  );

  const separatorSnippet =
    html.match(/<div style="[^"]*linear-gradient\(90deg,[^"]*"><\/div>/)?.[0] ??
    "";

  assert.match(separatorSnippet, /margin-top:54px/);
  assert.match(separatorSnippet, /height:6px/);
  assert.match(
    separatorSnippet,
    /linear-gradient\(90deg,\s*rgba\(34, 211, 238, 0\.000\).*rgb\(34, 211, 238\).*rgba\(34, 211, 238, 0\.000\)\)/,
  );
});

test("centered course skips the background image when the source is blank", () => {
  const html = renderToStaticMarkup(
    <CenteredCourseThumbnailTemplate {...baseProps} tutorialImageUrl="   " />,
  );

  assert.doesNotMatch(html, /alt="Tutorial Background"/);
  assert.doesNotMatch(html, /src="\s*"/);
});

test("centered templates render top-left and top-right capsules only when enabled", () => {
  const html = renderToStaticMarkup(
    <CenteredCourseThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        show_duration_capsule: "true",
        duration_capsule_text: "10 min",
        show_level_capsule: "true",
        level_capsule_value: "advanced",
        show_instructor_capsule: "true",
        instructor_capsule_text: "Instructor Led",
        show_hands_on_lab_capsule: "true",
        hands_on_lab_capsule_text: "Hands-On Lab",
        capsule_size: "large",
      }}
    />,
  );

  assert.match(html, /data-capsule-position="top-left"/);
  assert.match(html, /data-capsule-position="top-right"/);
  assert.match(html, /data-capsule-kind="duration"/);
  assert.match(html, /data-capsule-kind="level"/);
  assert.match(html, /data-capsule-kind="instructor"/);
  assert.match(html, /data-capsule-kind="hands-on-lab"/);
  assert.match(html, />10 min</);
  assert.match(html, />Advanced</);
  assert.match(html, />Instructor Led</);
  assert.match(html, />Hands-On Lab</);
  assert.match(html, /font-size:78px/);
  assert.match(html, /<svg width="78" height="78"/);
});

test("centered templates apply capsule style and color overrides", () => {
  const html = renderToStaticMarkup(
    <CenteredCourseThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        show_duration_capsule: "true",
        duration_capsule_text: "10 min",
        capsule_style: "standard",
        capsule_color: "#ff8800",
      }}
    />,
  );

  assert.match(html, /background:rgba\(255, 136, 0, 0\.220\)/);
  assert.match(html, /border:1px solid rgba\(255, 136, 0, 0\.520\)/);
});

test("centered templates keep capsules hidden when their toggles stay off", () => {
  const html = renderToStaticMarkup(
    <CenteredThumbnailTemplate {...baseProps} />,
  );

  assert.doesNotMatch(html, /data-capsule-kind=/);
});

test("footer size can be increased for centered templates", () => {
  const html = renderToStaticMarkup(
    <CenteredThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        footer_size: "large",
      }}
    />,
  );

  const footerSnippet =
    html.match(/<div style="[^"]*opacity:0\.72[^"]*">© 2026 LocalM™<\/div>/)?.[0] ?? "";

  assert.match(footerSnippet, /font-size:115px/);
});
