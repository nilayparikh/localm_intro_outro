import { getTemplateDef } from "../templates";
import type { ThemeDefinition } from "../templates/types";
import {
  BUILT_IN_THEME_DEFINITIONS,
  resolveThemeDefinition,
} from "../themes/themeDefinitions";

export interface ThumbnailTemplateCapabilities {
  showsBrandLogo: boolean;
  showsTutorialImage: boolean;
  showsTutorialImageBottomPadding: boolean;
  showsTutorialImageOpacity: boolean;
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
  const showsTutorialImage = showsBrandLogo;

  return {
    showsBrandLogo,
    showsTutorialImage,
    showsTutorialImageBottomPadding: showsBrandLogo,
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
