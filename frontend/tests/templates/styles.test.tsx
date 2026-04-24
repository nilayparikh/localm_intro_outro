import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CenteredThumbnailTemplate } from "../../src/templates/CenteredThumbnailTemplate";
import { TutorialThumbnailTemplate } from "../../src/templates/TutorialThumbnailTemplate";
import { CenteredCourseThumbnailTemplate } from "../../src/templates/CenteredCourseThumbnailTemplate";
import { IntroBiteThumbnailTemplate } from "../../src/templates/IntroBiteThumbnailTemplate";
import { IntroSplitThumbnailTemplate } from "../../src/templates/IntroSplitThumbnailTemplate";
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
  assert.match(html, /background-image:linear-gradient\(/);
  assert.match(html, /background-clip:padding-box, border-box/);
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
  assert.equal(style.borderWidth, "24px");
  assert.equal(style.borderStyle, "solid");
  assert.equal(style.borderColor, "transparent");
  assert.equal(style.borderImageSource, undefined);
  assert.equal(style.borderImageSlice, undefined);
  assert.equal(style.backgroundOrigin, "border-box");
  assert.equal(style.backgroundClip, "padding-box, border-box");
  assert.match(
    String(style.backgroundImage),
    /linear-gradient\(135deg, #22d3ee, #f59e0b\)/,
  );
});

test("gradient borders fall back to the theme border accent instead of a dark text color", () => {
  const style = buildTemplateFrameStyle({
    width: 3840,
    height: 2160,
    fontFamily: "'Outfit', sans-serif",
    theme: {
      ...baseTheme,
      borderColor: "#f59e0b",
    },
    borderWidth: 24,
    borderColor: "#22d3ee",
    borderStyle: "gradient",
  });

  assert.match(
    String(style.backgroundImage),
    /linear-gradient\(135deg, #22d3ee, #f59e0b\)/,
  );
  assert.doesNotMatch(String(style.backgroundImage), /#94a3b8/);
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

test("intro bite template can hide Bite From and Original Video Title independently", () => {
  const hideBothHtml = renderToStaticMarkup(
    <IntroBiteThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "5 Copilot Prompts That Save Time",
        show_source_label: "false",
        source_label: "BITE FROM",
        show_source_title: "false",
        source_title: "Context Engineering for GitHub Copilot",
      }}
    />,
  );

  assert.doesNotMatch(hideBothHtml, /data-template-region="bite-source"/);
  assert.doesNotMatch(hideBothHtml, />BITE FROM</);
  assert.doesNotMatch(hideBothHtml, />Context Engineering for GitHub Copilot</);

  const hideLabelOnlyHtml = renderToStaticMarkup(
    <IntroBiteThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "5 Copilot Prompts That Save Time",
        show_source_label: "false",
        source_label: "BITE FROM",
        show_source_title: "true",
        source_title: "Context Engineering for GitHub Copilot",
      }}
    />,
  );

  assert.doesNotMatch(hideLabelOnlyHtml, />BITE FROM</);
  assert.match(hideLabelOnlyHtml, />Context Engineering for GitHub Copilot</);
});

test("intro bite content stays centered in the capsule-safe region whether source attribution is shown or hidden", () => {
  const withAttributionHtml = renderToStaticMarkup(
    <IntroBiteThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "5 Copilot Prompts That Save Time",
        show_source_label: "true",
        source_label: "BITE FROM",
        show_source_title: "true",
        source_title: "Context Engineering for GitHub Copilot",
        show_bite_capsule: "true",
        show_duration_capsule: "true",
        duration_capsule_text: "45 sec",
        show_speed_capsule: "true",
      }}
    />,
  );

  const withoutAttributionHtml = renderToStaticMarkup(
    <IntroBiteThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "5 Copilot Prompts That Save Time",
        show_source_label: "false",
        show_source_title: "false",
        show_bite_capsule: "true",
        show_duration_capsule: "true",
        duration_capsule_text: "45 sec",
        show_speed_capsule: "true",
      }}
    />,
  );

  const withAttributionRegion =
    withAttributionHtml.match(
      /data-template-region="bite-main-content" style="[^"]*"/,
    )?.[0] ?? "";
  const withoutAttributionRegion =
    withoutAttributionHtml.match(
      /data-template-region="bite-main-content" style="[^"]*"/,
    )?.[0] ?? "";

  assert.match(withAttributionRegion, /top:[0-9]+px/);
  assert.match(withAttributionRegion, /bottom:0/);
  assert.match(withAttributionRegion, /justify-content:center/);

  const topWithAttribution = Number(
    withAttributionRegion.match(/top:([0-9]+)px/)?.[1] ?? "0",
  );
  const topWithoutAttribution = Number(
    withoutAttributionRegion.match(/top:([0-9]+)px/)?.[1] ?? "0",
  );

  assert.equal(topWithAttribution, topWithoutAttribution);
  assert.ok(topWithAttribution > 0);
});

test("intro split template renders side-aware regions with glass glow divider treatment", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "Ship Faster with Intro Split",
        split_title_side: "left",
        split_partition_points: "(12, 3), (9, 12), (12, 24)",
        split_background_opacity: "55",
        split_type_capsule: "course",
        split_foreground_scale: "132",
        split_foreground_x: "6",
        split_foreground_y: "-4",
      }}
      tutorialImageUrl="data:image/png;base64,foreground-image"
      overlayImageUrl="data:image/svg+xml;base64,background-svg"
    />,
  );

  assert.match(html, /data-template-region="intro-split-divider-glow"/);
  assert.match(html, /data-template-region="intro-split-title-left"/);
  assert.match(html, /data-template-region="intro-split-foreground-right"/);
  assert.match(html, /data-template-region="intro-split-type-capsule"/);
  assert.match(html, /clip-path:polygon\(/);
  assert.match(html, />COURSE</);
  assert.match(html, /translate\(6%, -4%\) scale\(1\.32\)/);
  assert.match(html, /blur\(/);
  const titleLayerSnippet =
    html.match(
      /data-template-region="intro-split-title-left" style="[^"]*"/,
    )?.[0] ?? "";
  assert.match(titleLayerSnippet, /z-index:30/);
  assert.doesNotMatch(titleLayerSnippet, /clip-path:/);
  assert.match(html, /data-template-region="intro-split-type-capsule-icon"/);
  assert.match(
    html,
    /data-template-region="intro-split-divider-glow"[^>]*style="[^"]*z-index:3/,
  );
  assert.match(html, /opacity:0\.55/);
  assert.match(html, /Ship Faster with Intro Split/);
  assert.doesNotMatch(html, />Intro \(Split\)</);
});

test("intro split foreground uses contain fit when scale is reduced below 100", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "Scale Down",
        split_title_side: "left",
        split_partition_points: "(12, 3), (12, 24)",
        split_foreground_scale: "70",
      }}
      tutorialImageUrl="data:image/png;base64,foreground-image"
    />,
  );

  assert.match(html, /object-fit:contain/);
  assert.match(html, /translate\(0%, 0%\) scale\(0\.70\)/);
});

test("intro split type capsule uses the same scale-aware sizing as other capsules", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        split_type_capsule: "bite",
        capsule_size: "small",
      }}
    />,
  );

  const typeCapsuleSnippet =
    html.match(
      /data-template-region="intro-split-type-capsule" style="[^"]*"/,
    )?.[0] ?? "";

  assert.match(typeCapsuleSnippet, /padding:30px 54px/);
  assert.match(typeCapsuleSnippet, /font-size:54px/);
  assert.match(
    html,
    /data-template-region="intro-split-type-capsule-icon"[^>]*><svg width="57" height="57"/,
  );
});

test("intro split keeps capsules above divider and title layers", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        split_type_capsule: "bite",
        show_duration_capsule: "true",
        duration_capsule_text: "10 min",
      }}
    />,
  );

  const capsuleGroupSnippet =
    html.match(/data-capsule-position="top-left" style="[^"]*"/)?.[0] ?? "";

  assert.match(capsuleGroupSnippet, /z-index:40/);
  assert.match(
    html,
    /data-template-region="intro-split-title-left" style="[^"]*z-index:30/,
  );
  assert.match(
    html,
    /data-template-region="intro-split-divider-glow"[^>]*style="[^"]*z-index:3/,
  );
});

test("intro split supports debug mode type capsule with an icon", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        split_type_capsule: "debug",
      }}
    />,
  );

  assert.match(html, />DEBUG MODE</);
  assert.match(html, /data-template-region="intro-split-type-capsule-icon"/);
});

test("intro split renders up to three bottom-corner asset icons opposite the title side", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...({
        ...baseProps,
        splitCornerIconUrls: [
          "data:image/png;base64,icon-1",
          "data:image/png;base64,icon-2",
          "data:image/png;base64,icon-3",
        ],
        splitCornerIconSize: 100,
      } as any)}
      values={{
        ...baseProps.values,
        split_title_side: "left",
      }}
    />,
  );

  const cornerIconSnippet =
    html.match(
      /data-template-region="intro-split-corner-icons" style="[^"]*"/,
    )?.[0] ?? "";

  assert.match(cornerIconSnippet, /right:120px/);
  assert.match(cornerIconSnippet, /bottom:108px/);
  assert.equal(
    Array.from(html.matchAll(/data-template-region="intro-split-corner-icon"/g))
      .length,
    3,
  );
  assert.match(
    html,
    /data-template-region="intro-split-corner-icon"[^>]*src="data:image\/png;base64,icon-1"/,
  );
  assert.match(
    html,
    /data-template-region="intro-split-corner-icon"[^>]*src="data:image\/png;base64,icon-2"/,
  );
  assert.match(
    html,
    /data-template-region="intro-split-corner-icon"[^>]*src="data:image\/png;base64,icon-3"/,
  );
});

test("intro split foreground can blend selected edges into the background over the last 10 percent", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        split_foreground_blend_left: "true",
        split_foreground_blend_top: "true",
      }}
      tutorialImageUrl="data:image/png;base64,foreground-image"
    />,
  );

  const foregroundImageSnippet =
    html.match(/alt="Split foreground" style="[^"]*"/)?.[0] ?? "";

  assert.match(
    foregroundImageSnippet,
    /mask-image:[^"]*linear-gradient\(to right, transparent 0%, black 10%, black 100%\)/,
  );
  assert.match(
    foregroundImageSnippet,
    /mask-image:[^"]*linear-gradient\(to bottom, transparent 0%, black 10%, black 100%\)/,
  );
});

test("intro split template flips title and foreground regions when title side is right", () => {
  const html = renderToStaticMarkup(
    <IntroSplitThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "Right Side Title",
        split_title_side: "right",
        split_partition_points: "(12, 3), (12, 24)",
      }}
      tutorialImageUrl="data:image/png;base64,foreground-image"
    />,
  );

  assert.match(html, /data-template-region="intro-split-title-right"/);
  assert.match(html, /data-template-region="intro-split-foreground-left"/);
  assert.match(html, /Right Side Title/);
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

test("outro renders a background svg layer and keeps the stage free of preview-image and arrow overlays", () => {
  const html = renderToStaticMarkup(
    <OutroThumbnailTemplate
      {...baseProps}
      overlayImageUrl="data:image/svg+xml;base64,background-svg"
      tutorialImageUrl="data:image/png;base64,preview-image"
      outroArrowOverlays={[
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
      ]}
      values={{
        ...baseProps.values,
        title: "Thank You for Watching",
        subtitle: "Want more? Subscribe and press the bell",
        outro_background_opacity: "55",
      }}
    />,
  );

  assert.match(html, /data-template-region="outro-background-svg"/);
  assert.match(html, /alt="Outro background asset"/);
  assert.match(html, /opacity:0\.55/);
  assert.doesNotMatch(html, /data-template-region="outro-suggested-image"/);
  assert.doesNotMatch(html, /data-template-region="outro-arrow-overlay"/);
  assert.doesNotMatch(html, /alt="Suggested Course Preview"/);
  assert.doesNotMatch(
    html,
    /data-template-region="outro-keep-learning-callout"/,
  );
});

test("outro renders newline-delimited support lines as separate rows", () => {
  const html = renderToStaticMarkup(
    <OutroThumbnailTemplate
      {...baseProps}
      values={{
        ...baseProps.values,
        title: "Thank You for Watching",
        subtitle: "Keep building\nSee you in the next one",
      }}
    />,
  );

  assert.match(html, /data-template-region="outro-support-lines"/);
  assert.match(html, />Keep building</);
  assert.match(html, />See you in the next one</);
});
