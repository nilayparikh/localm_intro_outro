import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COPYRIGHT_TEXT,
  buildBannerDialogState,
  clampBrandLogoSize,
  getThumbnailTemplateCapabilities,
  getThemeBorderColor,
} from "../../src/pages/thumbnailSettings";
import type { ThemeDefinition } from "../../src/templates/types";

test("tutorial-style templates expose pip logo and anchored tutorial image controls", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("tutorial_thumbnail"), {
    showsBrandLogo: true,
    showsTutorialImage: true,
    showsTutorialImageBottomPadding: true,
    showsTutorialImageOpacity: false,
  });

  assert.deepEqual(getThumbnailTemplateCapabilities("code_thumbnail"), {
    showsBrandLogo: true,
    showsTutorialImage: true,
    showsTutorialImageBottomPadding: true,
    showsTutorialImageOpacity: false,
  });
});

test("centered templates hide tutorial image controls entirely", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("centered_thumbnail"), {
    showsBrandLogo: false,
    showsTutorialImage: false,
    showsTutorialImageBottomPadding: false,
    showsTutorialImageOpacity: false,
  });

  assert.deepEqual(
    getThumbnailTemplateCapabilities("centered_course_thumbnail"),
    {
      showsBrandLogo: false,
      showsTutorialImage: false,
      showsTutorialImageBottomPadding: false,
      showsTutorialImageOpacity: false,
    },
  );
});

test("background template keeps border and grid controls while making the logo optional", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("background_thumbnail"), {
    showsBrandLogo: true,
    showsTutorialImage: false,
    showsTutorialImageBottomPadding: false,
    showsTutorialImageOpacity: false,
  });
});

test("save dialog starts from the current banner and keeps overwrite intent explicit", () => {
  assert.deepEqual(
    buildBannerDialogState({
      mode: "save",
      profileName: "RAG Intro",
      selectedBannerId: "banner-2",
      banners: [
        { id: "banner-1", name: "Banner One" },
        { id: "banner-2", name: "Banner Two" },
      ],
    }),
    {
      selectedBannerId: "banner-2",
      bannerName: "RAG Intro",
    },
  );
});

test("load dialog falls back to the most recent banner when nothing is selected yet", () => {
  assert.deepEqual(
    buildBannerDialogState({
      mode: "load",
      profileName: "",
      selectedBannerId: "",
      banners: [
        { id: "banner-new", name: "Newest Banner" },
        { id: "banner-old", name: "Older Banner" },
      ],
    }),
    {
      selectedBannerId: "banner-new",
      bannerName: "Newest Banner",
    },
  );
});

test("theme border color follows the selected theme accent by default", () => {
  assert.equal(getThemeBorderColor("dark"), "#3b82f6");
  assert.equal(getThemeBorderColor("localm-core"), "#00ff94");
});

test("theme border color prefers the saved dynamic theme value when provided", () => {
  const themes: ThemeDefinition[] = [
    {
      id: "custom",
      name: "Custom",
      description: "Custom theme",
      background: "#000000",
      surface: "#111111",
      textPrimary: "#ffffff",
      textSecondary: "#dddddd",
      accent: "#22c55e",
      borderColor: "#f59e0b",
      gradientStart: "#111111",
      gradientMid: "#222222",
      gradientEnd: "#333333",
      backgroundLayers: [],
      updatedAt: 0,
    },
  ];

  assert.equal(getThemeBorderColor("custom", themes), "#f59e0b");
});

test("brand logo size is clamped to the supported thumbnail range", () => {
  assert.equal(clampBrandLogoSize(10), 60);
  assert.equal(clampBrandLogoSize(90), 90);
  assert.equal(clampBrandLogoSize(180), 120);
});

test("copyright defaults stay aligned across thumbnail templates", () => {
  assert.equal(DEFAULT_COPYRIGHT_TEXT, "© 2026 LocalM™. All rights reserved.");
});
