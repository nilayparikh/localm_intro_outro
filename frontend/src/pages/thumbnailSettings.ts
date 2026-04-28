import { getTemplateDef } from "../templates";
import type { OutroArrowOverlay } from "../templates/outroArrowAssets";
import type {
  TemplateProps,
  ThemeColors,
  ThemeDefinition,
} from "../templates/types";
import {
  BUILT_IN_THEME_DEFINITIONS,
  resolveThemeDefinition,
} from "../themes/themeDefinitions";

export const DEFAULT_COPYRIGHT_TEXT = "© 2026 LocalM™. All rights reserved.";
const THUMBNAIL_PAGE_APP_NAME = "LocalM Media Mods";
const THUMBNAIL_PAGE_MODULE_NAME = "Intro Outro";
const DEFAULT_MOTION_DURATION_SECONDS = 3;
const DEFAULT_MOTION_AUDIO_START_SECONDS = 2;
const MIN_MOTION_DURATION_SECONDS = 1;
const MAX_MOTION_DURATION_SECONDS = 15;

export type ThumbnailExportAction = "png" | "zip" | "motion";
export type ThumbnailExportActivityState = Record<
  ThumbnailExportAction,
  number
>;

const CONTENT_FIELD_GROUPS: ReadonlyArray<readonly string[]> = [
  ["show_duration_capsule", "duration_capsule_text"],
  ["show_level_capsule", "level_capsule_value"],
  ["show_instructor_capsule", "instructor_capsule_text"],
  ["show_hands_on_lab_capsule", "hands_on_lab_capsule_text"],
  ["show_source_label", "source_label"],
  ["show_source_title", "source_title"],
  ["show_bite_capsule", "bite_capsule_text"],
  ["show_speed_capsule", "speed_capsule_text"],
  ["title_size", "secondary_size", "outro_headline_background"],
  ["split_title_side", "title_size", "split_title_width"],
  ["split_type_capsule", "split_course_title"],
  ["split_quote_style", "split_quote_bold"],
  ["split_quote_text"],
  [
    "split_quote_x",
    "split_quote_y",
    "split_quote_font_size",
    "split_quote_mark_size",
    "split_quote_width",
  ],
  [
    "split_course_lesson_current",
    "split_course_lesson_total",
    "split_course_title_gap",
    "split_course_block_size",
  ],
  ["show_grid", "grid_pattern"],
];

const CONTENT_FIELD_EXCLUSIONS = new Set([
  "footer_size",
  "capsule_style",
  "capsule_color",
  "capsule_size",
  "surface_style",
  "surface_shadow",
  "border_style",
  "border_color_secondary",
  "split_partition_points",
  "split_breakpoint_effect",
  "split_foreground_asset_id",
  "split_foreground_scale",
  "split_foreground_x",
  "split_foreground_y",
  "split_background_svg_asset_id",
  "split_background_opacity",
  "split_background_scale",
  "split_background_x",
  "split_background_y",
  "split_quote_enabled",
  "outro_background_svg_asset_id",
  "outro_background_opacity",
  "outro_background_scale",
  "outro_background_x",
  "outro_background_y",
  "split_corner_icon_asset_id_1",
  "split_corner_icon_asset_id_2",
  "split_corner_icon_asset_id_3",
  "split_corner_icon_size",
]);

export function clampBrandLogoSize(value: number): number {
  return Math.min(120, Math.max(60, Math.round(value)));
}

export function resolveMotionDurationSeconds(
  values: Record<string, string>,
): number {
  const rawValue = values["motion_duration_seconds"];
  const parsedValue = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_MOTION_DURATION_SECONDS;
  }

  return Math.min(
    MAX_MOTION_DURATION_SECONDS,
    Math.max(MIN_MOTION_DURATION_SECONDS, parsedValue),
  );
}

export function resolveExportActionLoadingState(
  activeExportActions: ThumbnailExportActivityState | null | undefined,
  preExportActions?: ThumbnailExportActivityState | null | undefined,
): { isImageExporting: boolean; isMotionExporting: boolean } {
  const activityState = activeExportActions ?? {
    png: 0,
    zip: 0,
    motion: 0,
  };
  const preExportState = preExportActions ?? {
    png: 0,
    zip: 0,
    motion: 0,
  };

  return {
    isImageExporting: activityState.png > 0 || preExportState.png > 0,
    isMotionExporting: activityState.motion > 0 || preExportState.motion > 0,
  };
}

export function buildThumbnailContentFieldRows<T extends { id: string }>(
  fields: T[],
): string[][] {
  const remainingFieldIds = new Set(fields.map((field) => field.id));
  const rows: string[][] = [];

  for (const field of fields) {
    const fieldId = field.id;

    if (CONTENT_FIELD_EXCLUSIONS.has(fieldId)) {
      remainingFieldIds.delete(fieldId);
      continue;
    }

    if (!remainingFieldIds.has(fieldId)) {
      continue;
    }

    const groupedRow = CONTENT_FIELD_GROUPS.find((group) =>
      group.includes(fieldId),
    );

    if (!groupedRow) {
      remainingFieldIds.delete(fieldId);
      rows.push([fieldId]);
      continue;
    }

    const row = groupedRow.filter((groupedFieldId) =>
      remainingFieldIds.has(groupedFieldId),
    );

    row.forEach((groupedFieldId) => {
      remainingFieldIds.delete(groupedFieldId);
    });

    if (row.length > 0) {
      rows.push([...row]);
    }
  }

  return rows;
}

export interface ThumbnailTemplateCapabilities {
  showsBrandLogo: boolean;
  showsTutorialImage: boolean;
  showsTutorialImageBottomPadding: boolean;
  showsTutorialImageOpacity: boolean;
  showsYoutubeOverlayAsset: boolean;
  showsSharedAudioAsset: boolean;
}

export interface ThumbnailTemplateRenderInput {
  width: number;
  height: number;
  values: Record<string, string>;
  theme: ThemeColors;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  fontSize: number;
  borderWidth: number;
  borderColor: string;
  overlayImageUrl?: string | null;
  overlayImageScale?: number;
  overlayImageX?: number;
  overlayImageY?: number;
  splitBlendImageUrl?: string | null;
  splitCornerIconUrls?: string[];
  splitCornerIconSize?: number;
  brandLogoUrl: string | null;
  brandLogoSize: number;
  tutorialImageUrl: string | null;
  tutorialImageSize: number;
  tutorialImageBottomPadding: number;
  tutorialImageOpacity: number;
  outroArrowOverlays?: OutroArrowOverlay[];
  socialAccounts?: Record<string, string>;
  showCopyrightMessage: boolean;
  copyrightText: string;
}

export interface BannerDialogEntry {
  id: string;
  name: string;
}

export interface BannerDialogState {
  selectedBannerId: string;
  bannerName: string;
  saveAction?: "overwrite" | "save-as-new";
}

export interface ThumbnailTemplateAssetBindingsInput {
  templateId: string;
  tutorialImageUrl: string | null;
  splitForegroundAssetUrl: string | null;
  splitBackgroundSvgAssetUrl: string | null;
  outroBackgroundSvgAssetUrl: string | null;
}

const TEMPLATE_AUDIO_ASSET_FIELD_IDS: Record<string, string> = {
  intro_bite_thumbnail: "intro_audio_asset_id",
  intro_split_thumbnail: "intro_audio_asset_id",
  outro_thumbnail: "outro_audio_asset_id",
};

const TEMPLATE_AUDIO_START_FIELD_IDS: Record<string, string> = {
  intro_bite_thumbnail: "intro_audio_start_seconds",
  intro_split_thumbnail: "intro_audio_start_seconds",
  outro_thumbnail: "outro_audio_start_seconds",
};

export function getTemplateAudioAssetFieldId(
  templateId: string,
): string | null {
  return TEMPLATE_AUDIO_ASSET_FIELD_IDS[templateId] ?? null;
}

export function getTemplateAudioStartFieldId(
  templateId: string,
): string | null {
  return TEMPLATE_AUDIO_START_FIELD_IDS[templateId] ?? null;
}

export function resolveMotionAudioStartSeconds(
  values: Record<string, string>,
  audioStartFieldId: string | null,
  maxAudioStartSeconds: number,
): number {
  if (!audioStartFieldId) {
    return 0;
  }

  const sanitizedMaxAudioStartSeconds = Math.max(
    0,
    Math.floor(maxAudioStartSeconds),
  );
  const rawValue = values[audioStartFieldId];
  const parsedValue = Number.parseInt(rawValue ?? "", 10);
  const resolvedValue = Number.isFinite(parsedValue)
    ? parsedValue
    : DEFAULT_MOTION_AUDIO_START_SECONDS;

  return Math.min(sanitizedMaxAudioStartSeconds, Math.max(0, resolvedValue));
}

export function getThumbnailTemplateCapabilities(
  templateId: string,
): ThumbnailTemplateCapabilities {
  const template = getTemplateDef(templateId);
  const showsBrandLogo = template?.hasPip ?? false;
  const showsTutorialImage = template?.supportsTutorialImage ?? showsBrandLogo;

  return {
    showsBrandLogo,
    showsTutorialImage,
    showsTutorialImageBottomPadding: showsTutorialImage && showsBrandLogo,
    showsTutorialImageOpacity: showsTutorialImage && !showsBrandLogo,
    showsYoutubeOverlayAsset: false,
    showsSharedAudioAsset: getTemplateAudioAssetFieldId(templateId) !== null,
  };
}

export function buildBannerDialogState({
  mode,
  profileName,
  selectedBannerId,
  banners,
}: {
  mode: "load" | "save";
  profileName: string;
  selectedBannerId: string;
  banners: BannerDialogEntry[];
}): BannerDialogState {
  const selectedBanner =
    banners.find((banner) => banner.id === selectedBannerId) ??
    banners[0] ??
    null;

  if (mode === "save") {
    return {
      selectedBannerId,
      bannerName: profileName.trim() || selectedBanner?.name || "",
      saveAction: selectedBannerId ? "overwrite" : "save-as-new",
    };
  }

  return {
    selectedBannerId: selectedBanner?.id ?? "",
    bannerName: selectedBanner?.name ?? "",
  };
}

export function getThemeBorderColor(
  themeId: string,
  themes: ThemeDefinition[] = BUILT_IN_THEME_DEFINITIONS,
): string {
  const theme = resolveThemeDefinition(themes, themeId);
  return theme.borderColor || theme.accent;
}

export function buildThumbnailPageTitle(templateName?: string | null): string {
  const baseTitle = `${THUMBNAIL_PAGE_APP_NAME} | ${THUMBNAIL_PAGE_MODULE_NAME}`;
  const resolvedTemplateName = templateName?.trim();

  return resolvedTemplateName
    ? `${baseTitle} | ${resolvedTemplateName}`
    : baseTitle;
}

export function resolveThumbnailTemplateAssetBindings({
  templateId,
  tutorialImageUrl,
  splitForegroundAssetUrl,
  splitBackgroundSvgAssetUrl,
  outroBackgroundSvgAssetUrl,
}: ThumbnailTemplateAssetBindingsInput): {
  tutorialImageUrl: string | null;
  overlayImageUrl: string | null;
} {
  if (templateId === "intro_split_thumbnail") {
    return {
      tutorialImageUrl: splitForegroundAssetUrl,
      overlayImageUrl: splitBackgroundSvgAssetUrl,
    };
  }

  if (templateId === "outro_thumbnail") {
    return {
      tutorialImageUrl,
      overlayImageUrl: outroBackgroundSvgAssetUrl,
    };
  }

  return {
    tutorialImageUrl,
    overlayImageUrl: null,
  };
}

export function buildThumbnailTemplateRenderProps(
  input: ThumbnailTemplateRenderInput,
): TemplateProps {
  return {
    width: input.width,
    height: input.height,
    values: input.values,
    theme: input.theme,
    primaryFontFamily: input.primaryFontFamily,
    secondaryFontFamily: input.secondaryFontFamily,
    fontSize: input.fontSize,
    socialAccounts: input.socialAccounts ?? {},
    socialPosition: "center",
    socialRenderMode: input.showCopyrightMessage ? "full" : "hidden",
    borderWidth: input.borderWidth,
    borderColor: input.borderColor,
    overlayImageUrl: input.overlayImageUrl ?? null,
    overlayImageScale: input.overlayImageScale,
    overlayImageX: input.overlayImageX,
    overlayImageY: input.overlayImageY,
    overlayImageSize: 180,
    splitBlendImageUrl: input.splitBlendImageUrl ?? null,
    splitCornerIconUrls: input.splitCornerIconUrls,
    splitCornerIconSize: input.splitCornerIconSize,
    brandLogoUrl: input.brandLogoUrl,
    brandLogoSize: input.brandLogoSize,
    brandLogoPosition: "top-right",
    instructorStyle: "minimal",
    tutorialImageUrl: input.tutorialImageUrl,
    tutorialImageSize: input.tutorialImageSize,
    tutorialImageBottomPadding: input.tutorialImageBottomPadding,
    tutorialImageOpacity: input.tutorialImageOpacity,
    outroArrowOverlays: input.outroArrowOverlays,
    copyrightText: input.copyrightText,
  };
}

export function resolveBrandLogoUrlFromSettings({
  currentBrandLogoUrl,
  previousSettingsLogoUrl,
  nextSettingsLogoUrl,
}: {
  currentBrandLogoUrl: string | null;
  previousSettingsLogoUrl: string | null;
  nextSettingsLogoUrl: string | null;
}): string | null {
  const currentLogo = currentBrandLogoUrl?.trim() || null;
  const previousSharedLogo = previousSettingsLogoUrl?.trim() || null;
  const nextSharedLogo = nextSettingsLogoUrl?.trim() || null;

  if (!currentLogo) {
    return nextSharedLogo;
  }

  if (previousSharedLogo && currentLogo === previousSharedLogo) {
    return nextSharedLogo;
  }

  return currentLogo;
}

function isSharedSettingsLogoPath(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return /^logos\/logo(?:-\d+)?\.[a-z0-9]+$/i.test(value);
}

export function resolvePersistedBrandLogoUrl({
  currentBrandLogoUrl,
  settingsLogoUrl,
}: {
  currentBrandLogoUrl: string | null;
  settingsLogoUrl: string | null;
}): string | null {
  const currentLogo = currentBrandLogoUrl?.trim() || null;
  const sharedLogo = settingsLogoUrl?.trim() || null;

  if (!currentLogo) {
    return null;
  }

  if (sharedLogo && currentLogo === sharedLogo) {
    return null;
  }

  if (isSharedSettingsLogoPath(currentLogo)) {
    return null;
  }

  return currentLogo;
}

export function resolveLoadedBrandLogoUrl({
  storedBrandLogoUrl,
  settingsLogoUrl,
}: {
  storedBrandLogoUrl: string | null;
  settingsLogoUrl: string | null;
}): string | null {
  const storedLogo = storedBrandLogoUrl?.trim() || null;
  const sharedLogo = settingsLogoUrl?.trim() || null;

  if (!storedLogo) {
    return sharedLogo;
  }

  if (isSharedSettingsLogoPath(storedLogo)) {
    return sharedLogo;
  }

  return storedLogo;
}
