import test from "node:test";
import assert from "node:assert/strict";
import { createAzureCachedCollectionApi } from "@common";
import {
  prepareBannerForSave,
  type BannerDoc,
  type BannerSaveInput,
} from "../../src/persistence/bannerPersistence";
import {
  mergeStoredThemesWithBuiltIns,
  prepareThemeForSave,
} from "../../src/persistence/themePersistence";
import type { ThemeDefinition } from "../../src/templates/types";

function createFakeRxCollection<TRecord extends { id: string }>(
  initialRecords: TRecord[] = [],
) {
  const records = new Map(initialRecords.map((record) => [record.id, record]));

  return {
    find: () => ({
      exec: async () =>
        [...records.values()].map((record) => ({
          toJSON: () => record,
          remove: async () => {
            records.delete(record.id);
          },
        })),
    }),
    findOne: (id: string) => ({
      exec: async () => {
        const record = records.get(id);
        if (!record) {
          return null;
        }

        return {
          toJSON: () => record,
          remove: async () => {
            records.delete(id);
          },
        };
      },
    }),
    upsert: async (record: TRecord) => {
      records.set(record.id, record);
      return record;
    },
    snapshot: () => [...records.values()],
  };
}

function createMemoryRemoteAdapter<TRecord extends { id: string }>() {
  const records = new Map<string, TRecord>();

  return {
    adapter: {
      list: async () => [...records.values()],
      upsert: async (record: TRecord) => {
        records.set(record.id, record);
        return record;
      },
      delete: async (id: string) => {
        records.delete(id);
      },
    },
    snapshot: () => [...records.values()],
  };
}

test("New Banner created on machine A appears on machine B after refresh", async () => {
  const remote = createMemoryRemoteAdapter<BannerDoc>();
  const machineACollection = createFakeRxCollection<BannerDoc>();
  const machineBCollection = createFakeRxCollection<BannerDoc>();

  const machineAApi = createAzureCachedCollectionApi<
    BannerDoc,
    BannerSaveInput
  >({
    collection: machineACollection,
    remote: remote.adapter,
    prepareForSave: prepareBannerForSave,
  });
  const machineBApi = createAzureCachedCollectionApi<
    BannerDoc,
    BannerSaveInput
  >({
    collection: machineBCollection,
    remote: remote.adapter,
    prepareForSave: prepareBannerForSave,
  });

  await machineAApi.save({
    name: "New Banner",
    templateId: "outro_thumbnail",
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title: "Final Outro" },
    borderWidth: 0,
    borderColor: "#ffffff",
    fontPairId: "pair-1",
    primaryFontFamily: "Inter",
    secondaryFontFamily: "Roboto",
    fontSize: 48,
    brandLogoUrl: null,
    brandLogoSize: 80,
    showCopyrightMessage: true,
    copyrightText: "Copyright",
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 0,
    tutorialImageOpacity: 100,
    templateEntries: [
      {
        templateId: "tutorial_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: { title: "Shared Tutorial Banner" },
        borderWidth: 0,
        borderColor: "#ffffff",
        fontPairId: "pair-1",
        primaryFontFamily: "Inter",
        secondaryFontFamily: "Roboto",
        fontSize: 48,
        brandLogoUrl: null,
        brandLogoSize: 80,
        showCopyrightMessage: true,
        copyrightText: "Copyright",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 0,
        tutorialImageOpacity: 100,
      },
      {
        templateId: "outro_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: { title: "First Outro" },
        borderWidth: 0,
        borderColor: "#ffffff",
        fontPairId: "pair-1",
        primaryFontFamily: "Inter",
        secondaryFontFamily: "Roboto",
        fontSize: 48,
        brandLogoUrl: null,
        brandLogoSize: 80,
        showCopyrightMessage: true,
        copyrightText: "Copyright",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 0,
        tutorialImageOpacity: 100,
      },
      {
        templateId: "outro_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: { title: "Final Outro" },
        borderWidth: 0,
        borderColor: "#ffffff",
        fontPairId: "pair-1",
        primaryFontFamily: "Inter",
        secondaryFontFamily: "Roboto",
        fontSize: 48,
        brandLogoUrl: null,
        brandLogoSize: 80,
        showCopyrightMessage: true,
        copyrightText: "Copyright",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 0,
        tutorialImageOpacity: 100,
      },
    ],
  });

  await machineBApi.refresh();

  assert.equal(remote.snapshot()[0]?.name, "New Banner");
  assert.equal(machineBCollection.snapshot()[0]?.name, "New Banner");
  assert.deepEqual(
    machineBCollection.snapshot()[0]?.templateEntries?.map(
      (entry) => entry.templateId,
    ),
    ["tutorial_thumbnail", "outro_thumbnail"],
  );
  assert.equal(
    machineBCollection.snapshot()[0]?.templateEntries?.find(
      (entry) => entry.templateId === "outro_thumbnail",
    )?.fieldValues.title,
    "Final Outro",
  );
});

test("Dark Duplicate theme created on machine A appears on machine B after refresh", async () => {
  const remote = createMemoryRemoteAdapter<ThemeDefinition>();
  const machineACollection = createFakeRxCollection<ThemeDefinition>();
  const machineBCollection = createFakeRxCollection<ThemeDefinition>();

  const machineAApi = createAzureCachedCollectionApi<
    ThemeDefinition,
    Partial<ThemeDefinition>
  >({
    collection: machineACollection,
    remote: remote.adapter,
    prepareForSave: (theme) =>
      prepareThemeForSave(
        theme,
        mergeStoredThemesWithBuiltIns(machineACollection.snapshot()),
      ),
  });
  const machineBApi = createAzureCachedCollectionApi<
    ThemeDefinition,
    Partial<ThemeDefinition>
  >({
    collection: machineBCollection,
    remote: remote.adapter,
    prepareForSave: (theme) =>
      prepareThemeForSave(
        theme,
        mergeStoredThemesWithBuiltIns(machineBCollection.snapshot()),
      ),
  });

  await machineAApi.save({
    name: "Dark Duplicate",
    description: "Stored remotely",
    accent: "#00ff94",
  });

  await machineBApi.refresh();

  const machineBThemes = mergeStoredThemesWithBuiltIns(
    machineBCollection.snapshot(),
  );
  const syncedTheme = machineBThemes.find(
    (theme) => theme.name === "Dark Duplicate",
  );

  assert.equal(remote.snapshot()[0]?.name, "Dark Duplicate");
  assert.equal(syncedTheme?.name, "Dark Duplicate");
});
