import {
  normalizeOutroArrowOverlays,
  type OutroArrowOverlay,
} from "../templates/outroArrowAssets";

export interface BannerTemplateEntry {
  templateId: string;
  themeId: string;
  platformId: string;
  fieldValues: Record<string, string>;
  borderWidth: number;
  borderColor: string;
  fontPairId: string;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  fontSize: number;
  brandLogoUrl: string | null;
  brandLogoSize: number;
  showCopyrightMessage: boolean;
  copyrightText: string;
  tutorialImageUrl: string | null;
  tutorialImageSize: number;
  tutorialImageBottomPadding: number;
  tutorialImageOpacity: number;
  outroArrowOverlays?: OutroArrowOverlay[];
}

export interface LegacyTemplateEntrySource {
  templateId: string;
  themeId: string;
  platformId: string;
  fieldValues: Record<string, string>;
  borderWidth: number;
  borderColor: string;
  fontPairId: string;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  fontSize: number;
  brandLogoUrl: string | null;
  brandLogoSize: number;
  showCopyrightMessage: boolean;
  copyrightText: string;
  tutorialImageUrl: string | null;
  tutorialImageSize: number;
  tutorialImageBottomPadding: number;
  tutorialImageOpacity: number;
  outroArrowOverlays?: OutroArrowOverlay[];
}

function normalizeBannerTemplateEntry(
  entry: BannerTemplateEntry,
): BannerTemplateEntry {
  return {
    ...entry,
    fieldValues: { ...entry.fieldValues },
    outroArrowOverlays: normalizeOutroArrowOverlays(entry.outroArrowOverlays),
  };
}

export function createTemplateEntryFromLegacySource(
  source: LegacyTemplateEntrySource,
): BannerTemplateEntry {
  return normalizeBannerTemplateEntry({
    templateId: source.templateId,
    themeId: source.themeId,
    platformId: source.platformId,
    fieldValues: source.fieldValues,
    borderWidth: source.borderWidth,
    borderColor: source.borderColor,
    fontPairId: source.fontPairId,
    primaryFontFamily: source.primaryFontFamily,
    secondaryFontFamily: source.secondaryFontFamily,
    fontSize: source.fontSize,
    brandLogoUrl: source.brandLogoUrl,
    brandLogoSize: source.brandLogoSize,
    showCopyrightMessage: source.showCopyrightMessage,
    copyrightText: source.copyrightText,
    tutorialImageUrl: source.tutorialImageUrl,
    tutorialImageSize: source.tutorialImageSize,
    tutorialImageBottomPadding: source.tutorialImageBottomPadding,
    tutorialImageOpacity: source.tutorialImageOpacity,
    outroArrowOverlays: source.outroArrowOverlays,
  });
}

export function upsertTemplateEntry(
  entries: BannerTemplateEntry[],
  entry: BannerTemplateEntry,
): BannerTemplateEntry[] {
  const existingIndex = entries.findIndex(
    (currentEntry) => currentEntry.templateId === entry.templateId,
  );

  if (existingIndex === -1) {
    return [...entries, entry];
  }

  return entries.map((currentEntry, index) =>
    index === existingIndex ? entry : currentEntry,
  );
}

export function normalizeTemplateEntries(
  entries: BannerTemplateEntry[] | undefined,
  legacyEntry?: BannerTemplateEntry,
): BannerTemplateEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) {
    return legacyEntry ? [normalizeBannerTemplateEntry(legacyEntry)] : [];
  }

  const normalizedEntries = entries.reduce<BannerTemplateEntry[]>(
    (currentEntries, entry) =>
      upsertTemplateEntry(currentEntries, normalizeBannerTemplateEntry(entry)),
    [],
  );

  return legacyEntry
    ? upsertTemplateEntry(
        normalizedEntries,
        normalizeBannerTemplateEntry(legacyEntry),
      )
    : normalizedEntries;
}

export function findTemplateEntry(
  entries: BannerTemplateEntry[],
  templateId: string,
): BannerTemplateEntry | null {
  return entries.find((entry) => entry.templateId === templateId) ?? null;
}

export function resolveTemplateSelection({
  entries,
  nextTemplateId,
  createEntry,
}: {
  entries: BannerTemplateEntry[];
  nextTemplateId: string;
  createEntry: () => BannerTemplateEntry;
}): {
  templateEntries: BannerTemplateEntry[];
  activeEntry: BannerTemplateEntry;
} {
  const existingEntry = findTemplateEntry(entries, nextTemplateId);
  if (existingEntry) {
    return {
      templateEntries: entries,
      activeEntry: existingEntry,
    };
  }

  const activeEntry = createEntry();
  return {
    templateEntries: upsertTemplateEntry(entries, activeEntry),
    activeEntry,
  };
}
