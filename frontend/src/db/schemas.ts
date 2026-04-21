import type { RxJsonSchema } from "rxdb";

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

export const bannersSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string" },
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
    updatedAt: { type: "number" },
  },
  required: ["id", "name", "updatedAt"],
  indexes: ["updatedAt"],
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
