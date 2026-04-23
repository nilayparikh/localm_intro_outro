import type { RxJsonSchema } from "rxdb";
import {
  createTemplateEntryFromLegacySource,
  normalizeTemplateEntries,
} from "../persistence/bannerTemplateEntries";
import { normalizeOutroArrowOverlays } from "../templates/outroArrowAssets";

const outroArrowOverlayArrayProperty = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      type: { type: "string" },
      text: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      degree: { type: "number" },
      isInverse: { type: "boolean" },
      textSize: { type: "number" },
      arrowSize: { type: "number" },
      isBold: { type: "boolean" },
      isItalic: { type: "boolean" },
      thickness: { type: "string" },
    },
    required: [
      "id",
      "type",
      "text",
      "x",
      "y",
      "degree",
      "isInverse",
      "textSize",
      "arrowSize",
      "isBold",
      "isItalic",
      "thickness",
    ],
  },
} as const;

const bannerTemplateEntryProperties = {
  templateId: { type: "string" },
  themeId: { type: "string" },
  platformId: { type: "string" },
  fieldValues: { type: "object" },
  borderWidth: { type: "number" },
  borderColor: { type: "string" },
  fontPairId: { type: "string" },
  primaryFontFamily: { type: "string" },
  secondaryFontFamily: { type: "string" },
  fontSize: { type: "number" },
  brandLogoUrl: { type: ["string", "null"] },
  brandLogoSize: { type: "number" },
  showCopyrightMessage: { type: "boolean" },
  copyrightText: { type: "string" },
  tutorialImageUrl: { type: ["string", "null"] },
  tutorialImageSize: { type: "number" },
  tutorialImageBottomPadding: { type: "number" },
  tutorialImageOpacity: { type: "number" },
  outroArrowOverlays: outroArrowOverlayArrayProperty,
} as const;

function createLegacyBannerTemplateEntry(
  documentData: Record<string, unknown>,
) {
  return createTemplateEntryFromLegacySource({
    templateId: String(documentData.templateId ?? "tutorial_thumbnail"),
    themeId: String(documentData.themeId ?? "dark"),
    platformId: String(documentData.platformId ?? "landscape_4k"),
    fieldValues: (documentData.fieldValues as Record<string, string>) ?? {},
    borderWidth: Number(documentData.borderWidth ?? 0),
    borderColor: String(documentData.borderColor ?? "#ffffff"),
    fontPairId: String(documentData.fontPairId ?? ""),
    primaryFontFamily: String(documentData.primaryFontFamily ?? ""),
    secondaryFontFamily: String(documentData.secondaryFontFamily ?? ""),
    fontSize: Number(documentData.fontSize ?? 48),
    brandLogoUrl: (documentData.brandLogoUrl as string | null) ?? null,
    brandLogoSize: Number(documentData.brandLogoSize ?? 90),
    showCopyrightMessage: Boolean(documentData.showCopyrightMessage ?? true),
    copyrightText: String(documentData.copyrightText ?? ""),
    tutorialImageUrl: (documentData.tutorialImageUrl as string | null) ?? null,
    tutorialImageSize: Number(documentData.tutorialImageSize ?? 100),
    tutorialImageBottomPadding: Number(
      documentData.tutorialImageBottomPadding ?? 24,
    ),
    tutorialImageOpacity: Number(documentData.tutorialImageOpacity ?? 100),
    outroArrowOverlays: normalizeOutroArrowOverlays(
      documentData.outroArrowOverlays,
    ),
  });
}

const bannerTemplateEntryRequired = [
  "templateId",
  "themeId",
  "platformId",
  "fieldValues",
  "borderWidth",
  "borderColor",
  "fontPairId",
  "primaryFontFamily",
  "secondaryFontFamily",
  "fontSize",
  "brandLogoUrl",
  "brandLogoSize",
  "showCopyrightMessage",
  "copyrightText",
  "tutorialImageUrl",
  "tutorialImageSize",
  "tutorialImageBottomPadding",
  "tutorialImageOpacity",
] as const;

export const settingsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    display_name: { type: "string" },
    website: { type: "string" },
    social_accounts: { type: "object" },
    logo_url: { type: ["string", "null"] },
    updatedAt: { type: "number" },
  },
  required: ["id", "updatedAt"],
};

export const presetsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    name: { type: "string" },
    templateId: { type: "string" },
    fieldValues: { type: "object" },
    themeId: { type: "string" },
    borderWidth: { type: "number" },
    fontPairId: { type: "string" },
    primaryFontFamily: { type: "string" },
    secondaryFontFamily: { type: "string" },
    fontSize: { type: "number" },
    updatedAt: { type: "number" },
  },
  required: ["id", "name", "updatedAt"],
};

export const assetsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 120 },
    name: { type: "string" },
    fileName: { type: "string" },
    kind: { type: "string" },
    mimeType: { type: "string" },
    blobPath: { type: "string" },
    sizeBytes: { type: "number" },
    durationMs: { type: ["number", "null"] },
    previewImagePath: { type: ["string", "null"] },
    width: { type: ["number", "null"] },
    height: { type: ["number", "null"] },
    updatedAt: { type: "number" },
  },
  required: [
    "id",
    "name",
    "fileName",
    "kind",
    "mimeType",
    "blobPath",
    "sizeBytes",
    "durationMs",
    "previewImagePath",
    "width",
    "height",
    "updatedAt",
  ],
  indexes: ["updatedAt"],
};

export const assetsMigrationStrategies = {
  1: async (documentData: Record<string, unknown>) => ({
    sizeBytes: 0,
    durationMs: null,
    previewImagePath: null,
    width: null,
    height: null,
    ...documentData,
  }),
};

export const bannersSchema: RxJsonSchema<any> = {
  version: 3,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string" },
    templateId: { type: "string" },
    templateEntries: {
      type: "array",
      items: {
        type: "object",
        properties: bannerTemplateEntryProperties,
        required: bannerTemplateEntryRequired as unknown as string[],
      },
    },
    themeId: { type: "string" },
    platformId: { type: "string" },
    fieldValues: { type: "object" },
    borderWidth: { type: "number" },
    borderColor: { type: "string" },
    fontPairId: { type: "string" },
    primaryFontFamily: { type: "string" },
    secondaryFontFamily: { type: "string" },
    fontSize: { type: "number" },
    brandLogoUrl: { type: ["string", "null"] },
    brandLogoSize: { type: "number" },
    showCopyrightMessage: { type: "boolean" },
    copyrightText: { type: "string" },
    tutorialImageUrl: { type: ["string", "null"] },
    tutorialImageSize: { type: "number" },
    tutorialImageBottomPadding: { type: "number" },
    tutorialImageOpacity: { type: "number" },
    outroArrowOverlays: outroArrowOverlayArrayProperty,
    updatedAt: { type: "number" },
  },
  required: ["id", "name", "updatedAt"],
  indexes: ["updatedAt"],
};

export const bannersMigrationStrategies = {
  1: async (documentData: Record<string, unknown>) => {
    const templateEntries = normalizeTemplateEntries(
      documentData.templateEntries as any,
      createLegacyBannerTemplateEntry(documentData),
    );

    return {
      ...documentData,
      templateEntries,
    };
  },
  2: async (documentData: Record<string, unknown>) => ({
    ...documentData,
    templateEntries: normalizeTemplateEntries(
      documentData.templateEntries as any,
      createLegacyBannerTemplateEntry(documentData),
    ),
    outroArrowOverlays: normalizeOutroArrowOverlays(
      documentData.outroArrowOverlays,
    ),
  }),
  3: async (documentData: Record<string, unknown>) => ({
    ...documentData,
    templateEntries: normalizeTemplateEntries(
      documentData.templateEntries as any,
      createLegacyBannerTemplateEntry(documentData),
    ),
    outroArrowOverlays: normalizeOutroArrowOverlays(
      documentData.outroArrowOverlays,
    ),
  }),
};

export const themesSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 120 },
    name: { type: "string" },
    description: { type: "string" },
    background: { type: "string" },
    surface: { type: "string" },
    textPrimary: { type: "string" },
    textSecondary: { type: "string" },
    accent: { type: "string" },
    borderColor: { type: "string" },
    gradientStart: { type: "string" },
    gradientMid: { type: "string" },
    gradientEnd: { type: "string" },
    backgroundLayers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          angle: { type: "number" },
          centerX: { type: "number" },
          centerY: { type: "number" },
          radius: { type: "number" },
          opacity: { type: "number" },
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                color: { type: "string" },
                position: { type: "number" },
              },
              required: ["id", "color", "position"],
            },
          },
        },
        required: [
          "id",
          "type",
          "angle",
          "centerX",
          "centerY",
          "radius",
          "opacity",
          "stops",
        ],
      },
    },
    updatedAt: { type: "number" },
  },
  required: [
    "id",
    "name",
    "description",
    "background",
    "surface",
    "textPrimary",
    "textSecondary",
    "accent",
    "borderColor",
    "gradientStart",
    "gradientMid",
    "gradientEnd",
    "backgroundLayers",
    "updatedAt",
  ],
  indexes: ["updatedAt"],
};

export const appStateMigrationStrategies = {
  1: async (documentData: Record<string, unknown>) => {
    const { currentAnimationDraft: _removed, ...nextDocument } = documentData;
    return nextDocument;
  },
};

export const appStateSchema: RxJsonSchema<any> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    autoSaveOnLogout: { type: "boolean" },
    autoStartSync: { type: "boolean" },
    currentDraft: { type: ["object", "null"], additionalProperties: true },
    draftDirty: { type: "boolean" },
    lastSyncAt: { type: ["number", "null"] },
    lastSyncStatus: { type: "string", maxLength: 20 },
    lastSyncMessage: { type: "string" },
    updatedAt: { type: "number" },
  },
  required: [
    "id",
    "autoSaveOnLogout",
    "autoStartSync",
    "draftDirty",
    "lastSyncStatus",
    "lastSyncMessage",
    "updatedAt",
  ],
};
