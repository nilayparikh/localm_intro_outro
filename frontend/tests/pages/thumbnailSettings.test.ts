import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COPYRIGHT_TEXT,
  buildThumbnailContentFieldRows,
  buildBannerDialogState,
  clampBrandLogoSize,
  resolveExportActionLoadingState,
  getTemplateAudioAssetFieldId,
  getThumbnailTemplateCapabilities,
  getThemeBorderColor,
  resolveMotionDurationSeconds,
  resolveLoadedBrandLogoUrl,
  resolveBrandLogoUrlFromSettings,
  resolvePersistedBrandLogoUrl,
} from "../../src/pages/thumbnailSettings";
import type { ThemeDefinition } from "../../src/templates/types";

test("tutorial-style templates expose pip logo and anchored tutorial image controls", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("tutorial_thumbnail"), {
    showsBrandLogo: true,
    showsTutorialImage: true,
    showsTutorialImageBottomPadding: true,
    showsTutorialImageOpacity: false,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: false,
  });

  assert.deepEqual(getThumbnailTemplateCapabilities("code_thumbnail"), {
    showsBrandLogo: true,
    showsTutorialImage: true,
    showsTutorialImageBottomPadding: true,
    showsTutorialImageOpacity: false,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: false,
  });
});

test("centered templates hide tutorial image controls entirely", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("centered_thumbnail"), {
    showsBrandLogo: false,
    showsTutorialImage: false,
    showsTutorialImageBottomPadding: false,
    showsTutorialImageOpacity: false,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: false,
  });

  assert.deepEqual(
    getThumbnailTemplateCapabilities("centered_course_thumbnail"),
    {
      showsBrandLogo: false,
      showsTutorialImage: false,
      showsTutorialImageBottomPadding: false,
      showsTutorialImageOpacity: false,
      showsYoutubeOverlayAsset: false,
      showsSharedAudioAsset: false,
    },
  );
});

test("background template keeps border and grid controls while making the logo optional", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("background_thumbnail"), {
    showsBrandLogo: true,
    showsTutorialImage: false,
    showsTutorialImageBottomPadding: false,
    showsTutorialImageOpacity: false,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: false,
  });
});

test("intro bite and outro stay on the shared audio workflow without youtube overlay controls", () => {
  assert.deepEqual(getThumbnailTemplateCapabilities("intro_bite_thumbnail"), {
    showsBrandLogo: false,
    showsTutorialImage: false,
    showsTutorialImageBottomPadding: false,
    showsTutorialImageOpacity: false,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: true,
  });

  assert.deepEqual(getThumbnailTemplateCapabilities("outro_thumbnail"), {
    showsBrandLogo: false,
    showsTutorialImage: true,
    showsTutorialImageBottomPadding: false,
    showsTutorialImageOpacity: true,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: true,
  });
});

test("intro and outro templates persist shared audio selections under stable field ids", () => {
  assert.equal(
    getTemplateAudioAssetFieldId("intro_bite_thumbnail"),
    "intro_audio_asset_id",
  );
  assert.equal(
    getTemplateAudioAssetFieldId("outro_thumbnail"),
    "outro_audio_asset_id",
  );
  assert.equal(getTemplateAudioAssetFieldId("tutorial_thumbnail"), null);
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

test("motion duration defaults to 3 seconds and clamps unsupported values", () => {
  assert.equal(resolveMotionDurationSeconds({}), 3);
  assert.equal(
    resolveMotionDurationSeconds({ motion_duration_seconds: "0" }),
    1,
  );
  assert.equal(
    resolveMotionDurationSeconds({ motion_duration_seconds: "5" }),
    5,
  );
  assert.equal(
    resolveMotionDurationSeconds({ motion_duration_seconds: "24" }),
    15,
  );
});

test("export action loading state only marks the currently running export control as loading", () => {
  assert.deepEqual(
    resolveExportActionLoadingState({ png: 0, zip: 0, motion: 0 } as never),
    {
      isImageExporting: false,
      isMotionExporting: false,
    },
  );
  assert.deepEqual(
    resolveExportActionLoadingState({ png: 1, zip: 0, motion: 0 } as never),
    {
      isImageExporting: true,
      isMotionExporting: false,
    },
  );
  assert.deepEqual(
    resolveExportActionLoadingState({ png: 0, zip: 0, motion: 1 } as never),
    {
      isImageExporting: false,
      isMotionExporting: true,
    },
  );
  assert.deepEqual(
    resolveExportActionLoadingState({ png: 1, zip: 0, motion: 1 } as never),
    {
      isImageExporting: true,
      isMotionExporting: true,
    },
  );
  assert.deepEqual(
    resolveExportActionLoadingState({ png: 0, zip: 1, motion: 0 } as never),
    {
      isImageExporting: false,
      isMotionExporting: false,
    },
  );
});

test("copyright defaults stay aligned across thumbnail templates", () => {
  assert.equal(DEFAULT_COPYRIGHT_TEXT, "© 2026 LocalM™. All rights reserved.");
});

test("content field rows keep centered template controls paired on one line", () => {
  assert.deepEqual(
    buildThumbnailContentFieldRows([
      { id: "title", label: "Title", type: "text" },
      {
        id: "show_duration_capsule",
        label: "Show Duration Capsule",
        type: "select",
      },
      {
        id: "duration_capsule_text",
        label: "Duration Text",
        type: "text",
      },
      {
        id: "show_level_capsule",
        label: "Show Skill Capsule",
        type: "select",
      },
      {
        id: "level_capsule_value",
        label: "Skill Level",
        type: "select",
      },
      {
        id: "show_instructor_capsule",
        label: "Show Instructor Capsule",
        type: "select",
      },
      {
        id: "instructor_capsule_text",
        label: "Instructor Text",
        type: "text",
      },
      {
        id: "show_hands_on_lab_capsule",
        label: "Show Hands-On Lab Capsule",
        type: "select",
      },
      {
        id: "hands_on_lab_capsule_text",
        label: "Hands-On Lab Text",
        type: "text",
      },
      { id: "capsule_style", label: "Capsule Style", type: "select" },
      { id: "capsule_color", label: "Capsule Color", type: "color" },
      { id: "capsule_size", label: "Capsule Size", type: "select" },
      { id: "title_size", label: "Title Size", type: "select" },
      {
        id: "secondary_size",
        label: "Secondary Size",
        type: "select",
      },
      { id: "surface_style", label: "Surface Style", type: "select" },
      { id: "surface_shadow", label: "Surface Shadow", type: "select" },
      { id: "border_style", label: "Border Style", type: "select" },
      {
        id: "border_color_secondary",
        label: "Border Color 2",
        type: "color",
      },
      { id: "show_grid", label: "Show Grid Pattern", type: "select" },
      { id: "grid_pattern", label: "Grid Pattern", type: "select" },
      { id: "footer_size", label: "Footer Size", type: "select" },
    ]),
    [
      ["title"],
      ["show_duration_capsule", "duration_capsule_text"],
      ["show_level_capsule", "level_capsule_value"],
      ["show_instructor_capsule", "instructor_capsule_text"],
      ["show_hands_on_lab_capsule", "hands_on_lab_capsule_text"],
      ["title_size", "secondary_size"],
      ["show_grid", "grid_pattern"],
    ],
  );
});

test("content field rows keep intro bite attribution and capsule controls paired", () => {
  assert.deepEqual(
    buildThumbnailContentFieldRows([
      { id: "title", label: "Bite Title", type: "text" },
      { id: "source_label", label: "Source Label", type: "text" },
      { id: "source_title", label: "Source Title", type: "text" },
      {
        id: "show_bite_capsule",
        label: "Show Bite Capsule",
        type: "select",
      },
      { id: "bite_capsule_text", label: "Bite Capsule Text", type: "text" },
      {
        id: "show_duration_capsule",
        label: "Show Duration Capsule",
        type: "select",
      },
      { id: "duration_capsule_text", label: "Duration Text", type: "text" },
      {
        id: "show_speed_capsule",
        label: "Show Speed Capsule",
        type: "select",
      },
      { id: "speed_capsule_text", label: "Speed Text", type: "text" },
      { id: "title_size", label: "Title Size", type: "select" },
      { id: "secondary_size", label: "Secondary Size", type: "select" },
      { id: "show_grid", label: "Show Grid Pattern", type: "select" },
      { id: "grid_pattern", label: "Grid Pattern", type: "select" },
    ]),
    [
      ["title"],
      ["source_label", "source_title"],
      ["show_bite_capsule", "bite_capsule_text"],
      ["show_duration_capsule", "duration_capsule_text"],
      ["show_speed_capsule", "speed_capsule_text"],
      ["title_size", "secondary_size"],
      ["show_grid", "grid_pattern"],
    ],
  );
});

test("shared settings logo replaces the preview logo when the preview still points at the previous shared asset", () => {
  assert.equal(
    resolveBrandLogoUrlFromSettings({
      currentBrandLogoUrl: "logos/logo-1710000000000.png",
      previousSettingsLogoUrl: "logos/logo-1710000000000.png",
      nextSettingsLogoUrl: "logos/logo-1713571200000.png",
    }),
    "logos/logo-1713571200000.png",
  );
});

test("shared settings logo sync does not overwrite a custom local preview logo", () => {
  assert.equal(
    resolveBrandLogoUrlFromSettings({
      currentBrandLogoUrl: "data:image/png;base64,custom-preview",
      previousSettingsLogoUrl: "logos/logo-1710000000000.png",
      nextSettingsLogoUrl: "logos/logo-1713571200000.png",
    }),
    "data:image/png;base64,custom-preview",
  );
});

test("persisted banner state omits inherited shared logos so saved banners do not snapshot stale shared assets", () => {
  assert.equal(
    resolvePersistedBrandLogoUrl({
      currentBrandLogoUrl: "logos/logo-1713571200000.png",
      settingsLogoUrl: "logos/logo-1713571200000.png",
    }),
    null,
  );

  assert.equal(
    resolvePersistedBrandLogoUrl({
      currentBrandLogoUrl: "data:image/png;base64,custom-logo",
      settingsLogoUrl: "logos/logo-1713571200000.png",
    }),
    "data:image/png;base64,custom-logo",
  );
});

test("loaded banner state upgrades previously saved shared logo paths to the current shared logo", () => {
  assert.equal(
    resolveLoadedBrandLogoUrl({
      storedBrandLogoUrl: "logos/logo-1710000000000.png",
      settingsLogoUrl: "logos/logo-1713571200000.png",
    }),
    "logos/logo-1713571200000.png",
  );

  assert.equal(
    resolveLoadedBrandLogoUrl({
      storedBrandLogoUrl: "data:image/png;base64,custom-logo",
      settingsLogoUrl: "logos/logo-1713571200000.png",
    }),
    "data:image/png;base64,custom-logo",
  );
});
