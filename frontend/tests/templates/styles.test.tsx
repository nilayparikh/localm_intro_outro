import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CenteredThumbnailTemplate } from "../../src/templates/CenteredThumbnailTemplate";
import { TutorialThumbnailTemplate } from "../../src/templates/TutorialThumbnailTemplate";
import { CenteredCourseThumbnailTemplate } from "../../src/templates/CenteredCourseThumbnailTemplate";
import { IntroBiteThumbnailTemplate } from "../../src/templates/IntroBiteThumbnailTemplate";
import { OutroThumbnailTemplate } from "../../src/templates/OutroThumbnailTemplate";
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

function extractFontSize(snippet: string): number {
  const match = snippet.match(/font-size:([0-9.]+)px/);
  assert.ok(match, `Expected font-size in snippet: ${snippet}`);
  return Number(match[1]);
}

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

test("frame backgrounds use the configured theme background without adding extra overlay layers", () => {
  const style = buildTemplateFrameStyle({
    width: 3840,
    height: 2160,
    fontFamily: "'Outfit', sans-serif",
    theme: baseTheme,
    borderWidth: 0,
    borderColor: "#22d3ee",
  });

  assert.equal(
    style.background,
    "linear-gradient(135deg, #0b1120, #111827, #1e293b)",
  );
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
    html.match(
      /<div style="[^"]*opacity:0\.72[^"]*">© 2026 LocalM™<\/div>/,
    )?.[0] ?? "";

  assert.match(footerSnippet, /font-size:115px/);
});

test("intro bite template renders source attribution with bite, duration, and speed capsules", () => {
  const html = renderToStaticMarkup(
    <IntroBiteThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "5 Copilot Prompts That Save Time",
        source_label: "BITE FROM",
        source_title: "Context Engineering for GitHub Copilot",
        show_bite_capsule: "true",
        bite_capsule_text: "BITE",
        show_duration_capsule: "true",
        duration_capsule_text: "45 sec",
        show_speed_capsule: "true",
        speed_capsule_text: "Fast",
      }}
    />,
  );

  assert.match(html, /data-template-region="bite-source"/);
  assert.match(html, />BITE FROM</);
  assert.match(html, />Context Engineering for GitHub Copilot</);
  assert.doesNotMatch(html, /radial-gradient\(circle/);
  assert.doesNotMatch(html, /top:-44%;right:-18%;width:76%;height:148%/);
  assert.doesNotMatch(html, /left:-18%;bottom:-36%;width:72%;height:118%/);
  assert.match(html, /data-capsule-kind="bite"/);
  assert.match(html, /data-capsule-kind="duration"/);
  assert.match(html, /data-capsule-kind="speed"/);
  assert.match(html, /data-capsule-position="top-left"/);
  assert.match(html, /data-capsule-position="top-right"/);

  const biteTitleSnippet =
    html.match(
      /<div style="[^"]*">5 Copilot Prompts That Save Time<\/div>/,
    )?.[0] ?? "";
  const sourceLabelSnippet =
    html.match(/<div style="[^"]*">BITE FROM<\/div>/)?.[0] ?? "";
  const sourceTitleSnippet =
    html.match(
      /<div style="[^"]*">Context Engineering for GitHub Copilot<\/div>/,
    )?.[0] ?? "";

  assert.match(sourceLabelSnippet, /border-radius:/);
  assert.match(sourceLabelSnippet, /padding:42px 93px/);
  assert.match(sourceLabelSnippet, /text-transform:uppercase/);
  assert.match(sourceLabelSnippet, /color:#f8fafc/);
  assert.match(sourceLabelSnippet, /white-space:nowrap/);
  assert.match(sourceLabelSnippet, /font-size:48px/);

  const biteTitleSize = extractFontSize(biteTitleSnippet);
  const sourceTitleSize = extractFontSize(sourceTitleSnippet);
  const titleRatio = sourceTitleSize / biteTitleSize;

  assert.equal(biteTitleSize, 185);
  assert.equal(sourceTitleSize, 148);

  assert.ok(
    Math.abs(titleRatio - 0.8) < 0.03,
    `Expected source title to be about 80% of bite title size, got ${titleRatio.toFixed(3)}`,
  );
});

test("outro template keeps the CTA band clean for the audio-only outro flow", () => {
  const html = renderToStaticMarkup(
    <OutroThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "Thank You for Watching",
        subtitle: "Want more? Subscribe and press the bell",
      }}
    />,
  );

  assert.match(html, /data-template-region="outro-cta"/);
  assert.match(html, />Thank You for Watching</);
  assert.match(html, />Want more\? Subscribe and press the bell</);
  assert.doesNotMatch(html, /data-template-region="outro-subscribe-cta"/);
  assert.doesNotMatch(html, /data-template-region="outro-social-strip"/);
  assert.doesNotMatch(html, /data-template-region="outro-youtube-card"/);
  assert.doesNotMatch(html, /data-template-region="outro-x-card"/);
  assert.doesNotMatch(html, /data-cta-icon=/);
  assert.doesNotMatch(html, />@localm_tuts</);
  assert.doesNotMatch(html, />Learn AI with LocalM Tuts</);
  assert.doesNotMatch(html, />Follow on X for live Spaces</);
});

test("outro template ignores social handles and keeps only headline and support line", () => {
  const html = renderToStaticMarkup(
    <OutroThumbnailTemplate
      {...baseProps}
      socialAccounts={{
        x_twitter: "@localm_live",
        youtube: "AI Build Lab",
      }}
      values={{
        ...baseProps.values,
        title: "Thank You for Watching",
        subtitle: "Want more? Subscribe and press the bell",
      }}
    />,
  );

  assert.match(html, />Thank You for Watching</);
  assert.match(html, />Want more\? Subscribe and press the bell</);
  assert.doesNotMatch(html, /data-template-region="outro-subscribe-cta"/);
  assert.doesNotMatch(html, /data-template-region="outro-social-strip"/);
  assert.doesNotMatch(html, /data-template-region="outro-youtube-card"/);
  assert.doesNotMatch(html, /data-template-region="outro-x-card"/);
  assert.doesNotMatch(html, /data-cta-icon=/);
  assert.doesNotMatch(html, />@localm_live</);
  assert.doesNotMatch(html, />Learn AI with AI Build Lab</);
  assert.doesNotMatch(html, />Follow on X for live Spaces</);
});

test("outro support line stays at 80% of headline size", () => {
  const html = renderToStaticMarkup(
    <OutroThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "Thank You for Watching",
        subtitle: "Want more? Subscribe and press the bell",
      }}
    />,
  );

  const titleSnippet =
    html.match(/<div style="[^"]*">Thank You for Watching<\/div>/)?.[0] ?? "";
  const subtitleSnippet =
    html.match(
      /<div style="[^"]*">Want more\? Subscribe and press the bell<\/div>/,
    )?.[0] ?? "";

  const titleFontSize = extractFontSize(titleSnippet);
  const subtitleFontSize = extractFontSize(subtitleSnippet);
  const ratio = subtitleFontSize / titleFontSize;

  assert.equal(titleFontSize, 100);
  assert.equal(subtitleFontSize, 80);

  assert.ok(
    Math.abs(ratio - 0.8) < 0.02,
    `Expected support line to be about 80% of headline size, got ${ratio.toFixed(3)}`,
  );
});

test("outro can render multiple persisted arrow overlays from the shared arrow assets", () => {
  const outroProps = {
    ...baseProps,
    tutorialImageUrl: "data:image/png;base64,preview-image",
    tutorialImageSize: 118,
    tutorialImageOpacity: 88,
    outroArrowOverlays: [
      {
        id: "arrow-1",
        type: "subscribe",
        text: "SUBSCRIBE",
        x: 40,
        y: 66,
        degree: 12,
        isInverse: false,
        textSize: 124,
        arrowWidth: 142,
        arrowHeight: 120,
      },
      {
        id: "arrow-2",
        type: "course",
        text: "COURSE",
        x: 80,
        y: 76,
        degree: 318,
        isInverse: true,
        textSize: 92,
        arrowWidth: 110,
        arrowHeight: 138,
      },
    ],
  } as any;

  const html = renderToStaticMarkup(
    <OutroThumbnailTemplate
      {...outroProps}
      values={{
        ...baseProps.values,
        title: "Thank You for Watching",
        subtitle: "Want more? Subscribe and press the bell",
        show_outro_image: "true",
      }}
    />,
  );

  assert.match(html, /data-template-region="outro-suggested-image"/);
  assert.equal(
    Array.from(html.matchAll(/data-template-region="outro-arrow-overlay"/g))
      .length,
    2,
  );
  assert.match(html, /data-overlay-id="arrow-1"/);
  assert.match(html, /data-overlay-id="arrow-2"/);
  assert.match(html, /data-overlay-text-size="124"/);
  assert.match(html, /data-overlay-arrow-width="142"/);
  assert.match(html, /data-overlay-arrow-height="120"/);
  assert.match(html, />SUBSCRIBE</);
  assert.match(html, />COURSE</);
  assert.match(html, /alt="Suggested Course Preview"/);
  assert.doesNotMatch(html, /lengthAdjust="spacingAndGlyphs"/);
  assert.doesNotMatch(html, /textLength="/);
  assert.doesNotMatch(
    html,
    /data-template-region="outro-keep-learning-callout"/,
  );
});
