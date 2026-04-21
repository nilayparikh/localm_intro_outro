import { getTemplateDef } from "../templates";
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

const CONTENT_FIELD_GROUPS: ReadonlyArray<readonly string[]> = [
  ["show_duration_capsule", "duration_capsule_text"],
  ["show_level_capsule", "level_capsule_value"],
  ["show_instructor_capsule", "instructor_capsule_text"],
  ["show_hands_on_lab_capsule", "hands_on_lab_capsule_text"],
  ["title_size", "secondary_size"],
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
]);

export function clampBrandLogoSize(value: number): number {
  return Math.min(120, Math.max(60, Math.round(value)));
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
  brandLogoUrl: string | null;
  brandLogoSize: number;
  tutorialImageUrl: string | null;
  tutorialImageSize: number;
  tutorialImageBottomPadding: number;
  tutorialImageOpacity: number;
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
    socialAccounts: {},
    socialPosition: "center",
    socialRenderMode: input.showCopyrightMessage ? "full" : "hidden",
    borderWidth: input.borderWidth,
    borderColor: input.borderColor,
    overlayImageUrl: null,
    overlayImageSize: 180,
    brandLogoUrl: input.brandLogoUrl,
    brandLogoSize: input.brandLogoSize,
    brandLogoPosition: "top-right",
    instructorStyle: "minimal",
    tutorialImageUrl: input.tutorialImageUrl,
    tutorialImageSize: input.tutorialImageSize,
    tutorialImageBottomPadding: input.tutorialImageBottomPadding,
    tutorialImageOpacity: input.tutorialImageOpacity,
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
