import { v4 as uuidv4 } from "uuid";
import type { StoredAuthState } from "../auth";
import type { OutroArrowOverlay } from "../templates/outroArrowAssets";
import { normalizeOutroArrowOverlays } from "../templates/outroArrowAssets";
import { createAzureTableCrudAdapter } from "./azureCollectionAdapters";
import {
  createTemplateEntryFromLegacySource,
  normalizeTemplateEntries,
  type BannerTemplateEntry,
} from "./bannerTemplateEntries";

export interface BannerDoc {
  id: string;
  name: string;
  templateId: string;
  templateEntries?: BannerTemplateEntry[];
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
  updatedAt: number;
}

export type BannerSaveInput = Omit<BannerDoc, "id" | "updatedAt"> & {
  id?: string;
};

export const BANNER_SORT: Array<Record<string, "asc" | "desc">> = [
  { updatedAt: "desc" },
];

function hasLegacyTemplateEntrySource(
  input: Partial<BannerSaveInput>,
): input is BannerSaveInput {
  return (
    typeof input.templateId === "string" &&
    typeof input.themeId === "string" &&
    typeof input.platformId === "string" &&
    !!input.fieldValues &&
    !Array.isArray(input.fieldValues) &&
    typeof input.borderWidth === "number" &&
    typeof input.borderColor === "string" &&
    typeof input.fontPairId === "string" &&
    typeof input.primaryFontFamily === "string" &&
    typeof input.secondaryFontFamily === "string" &&
    typeof input.fontSize === "number" &&
    (typeof input.brandLogoUrl === "string" || input.brandLogoUrl === null) &&
    typeof input.brandLogoSize === "number" &&
    typeof input.showCopyrightMessage === "boolean" &&
    typeof input.copyrightText === "string" &&
    (typeof input.tutorialImageUrl === "string" ||
      input.tutorialImageUrl === null) &&
    typeof input.tutorialImageSize === "number" &&
    typeof input.tutorialImageBottomPadding === "number" &&
    typeof input.tutorialImageOpacity === "number"
  );
}

export function prepareBannerForSave(input: BannerSaveInput): BannerDoc {
  const legacyEntry = hasLegacyTemplateEntrySource(input)
    ? createTemplateEntryFromLegacySource(input)
    : undefined;
  const templateEntries = normalizeTemplateEntries(
    input.templateEntries,
    legacyEntry,
  );
  const outroArrowOverlays = normalizeOutroArrowOverlays(
    input.outroArrowOverlays,
  );

  return {
    ...input,
    outroArrowOverlays,
    ...(templateEntries.length > 0 ? { templateEntries } : {}),
    id: input.id ?? uuidv4(),
    updatedAt: Date.now(),
  };
}

export function createBannerRemoteAdapter(authState: StoredAuthState) {
  return createAzureTableCrudAdapter<BannerDoc>("banners", authState);
}
