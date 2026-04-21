import { v4 as uuidv4 } from "uuid";
import type { StoredAuthState } from "../auth";
import { createAzureTableCrudAdapter } from "./azureCollectionAdapters";

export interface BannerDoc {
  id: string;
  name: string;
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
  updatedAt: number;
}

export type BannerSaveInput = Omit<BannerDoc, "id" | "updatedAt"> & {
  id?: string;
};

export const BANNER_SORT: Array<Record<string, "asc" | "desc">> = [
  { updatedAt: "desc" },
];

export function prepareBannerForSave(input: BannerSaveInput): BannerDoc {
  return {
    ...input,
    id: input.id ?? uuidv4(),
    updatedAt: Date.now(),
  };
}

export function createBannerRemoteAdapter(authState: StoredAuthState) {
  return createAzureTableCrudAdapter<BannerDoc>("banners", authState);
}
