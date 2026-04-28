import { test, expect } from "@playwright/test";

const authState = {
  mode: "sas-token",
  sasToken: "fake-token",
  connection: {
    profile: "Dev",
    storageAccountName: "satutslocalm",
    tableEndpoint: "https://satutslocalm.table.core.windows.net",
    tableName: "BannersDev",
    blobEndpoint: "https://satutslocalm.blob.core.windows.net",
    blobContainerName: "banner",
  },
};

const draftState = {
  id: "ui_state",
  autoSaveOnLogout: true,
  autoStartSync: false,
  currentDraft: {
    bannerId: null,
    name: "Release Smoke Draft",
    templateId: "tutorial_thumbnail",
    templateEntries: [
      {
        templateId: "tutorial_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: {
          title: "Release Ready Thumbnail",
          subtitle: "Smoke test",
          badge: "Tutorial",
          motion_duration_seconds: "5",
          show_grid: "true",
          grid_pattern: "dots",
        },
        borderWidth: 24,
        borderColor: "#22d3ee",
        fontPairId: "share-tech-outfit",
        primaryFontFamily: "'Outfit', sans-serif",
        secondaryFontFamily: "'Share Tech Mono', monospace",
        fontSize: 96,
        brandLogoUrl: null,
        brandLogoSize: 90,
        showCopyrightMessage: true,
        copyrightText: "© LocalM™",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 24,
        tutorialImageOpacity: 100,
      },
      {
        templateId: "intro_bite_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: {
          title: "Stored Intro Bite Title",
          source_label: "BITE FROM",
          source_title: "Stored Source Video",
          show_bite_capsule: "true",
          bite_capsule_text: "BITE",
          show_duration_capsule: "true",
          duration_capsule_text: "45 sec",
          show_speed_capsule: "true",
          speed_capsule_text: "Fast",
          show_grid: "true",
          grid_pattern: "dots",
        },
        borderWidth: 24,
        borderColor: "#22d3ee",
        fontPairId: "share-tech-outfit",
        primaryFontFamily: "'Outfit', sans-serif",
        secondaryFontFamily: "'Share Tech Mono', monospace",
        fontSize: 96,
        brandLogoUrl: null,
        brandLogoSize: 90,
        showCopyrightMessage: true,
        copyrightText: "© LocalM™",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 24,
        tutorialImageOpacity: 100,
      },
    ],
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: {
      title: "Release Ready Thumbnail",
      subtitle: "Smoke test",
      badge: "Tutorial",
      motion_duration_seconds: "5",
      show_grid: "true",
      grid_pattern: "dots",
    },
    borderWidth: 24,
    borderColor: "#22d3ee",
    fontPairId: "share-tech-outfit",
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    brandLogoUrl: null,
    brandLogoSize: 90,
    showCopyrightMessage: true,
    copyrightText: "© LocalM™",
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 24,
    tutorialImageOpacity: 100,
  },
  draftDirty: false,
  lastSyncAt: null,
  lastSyncStatus: "idle",
  lastSyncMessage: "Sync has not run yet.",
  updatedAt: Date.now(),
};

const staleLocalBanner = {
  id: "stale-local-banner",
  name: "Stale Local Banner",
  templateId: "tutorial_thumbnail",
  templateEntries: [
    {
      templateId: "tutorial_thumbnail",
      themeId: "dark",
      platformId: "landscape_4k",
      fieldValues: {
        title: "Old Cached Title",
      },
      borderWidth: 0,
      borderColor: "#ffffff",
      fontPairId: "share-tech-outfit",
      primaryFontFamily: "'Outfit', sans-serif",
      secondaryFontFamily: "'Share Tech Mono', monospace",
      fontSize: 96,
      brandLogoUrl: null,
      brandLogoSize: 90,
      showCopyrightMessage: true,
      copyrightText: "© LocalM™",
      tutorialImageUrl: null,
      tutorialImageSize: 100,
      tutorialImageBottomPadding: 24,
      tutorialImageOpacity: 100,
    },
  ],
  themeId: "dark",
  platformId: "landscape_4k",
  fieldValues: {
    title: "Old Cached Title",
  },
  borderWidth: 0,
  borderColor: "#ffffff",
  fontPairId: "share-tech-outfit",
  primaryFontFamily: "'Outfit', sans-serif",
  secondaryFontFamily: "'Share Tech Mono', monospace",
  fontSize: 96,
  brandLogoUrl: null,
  brandLogoSize: 90,
  showCopyrightMessage: true,
  copyrightText: "© LocalM™",
  tutorialImageUrl: null,
  tutorialImageSize: 100,
  tutorialImageBottomPadding: 24,
  tutorialImageOpacity: 100,
  updatedAt: Date.now(),
};

const loadedBannerDraftState = {
  ...draftState,
  currentDraft: {
    ...draftState.currentDraft,
    bannerId: staleLocalBanner.id,
    name: staleLocalBanner.name,
    templateId: staleLocalBanner.templateId,
    templateEntries: staleLocalBanner.templateEntries,
    themeId: staleLocalBanner.themeId,
    platformId: staleLocalBanner.platformId,
    fieldValues: staleLocalBanner.fieldValues,
    borderWidth: staleLocalBanner.borderWidth,
    borderColor: staleLocalBanner.borderColor,
    fontPairId: staleLocalBanner.fontPairId,
    primaryFontFamily: staleLocalBanner.primaryFontFamily,
    secondaryFontFamily: staleLocalBanner.secondaryFontFamily,
    fontSize: staleLocalBanner.fontSize,
    brandLogoUrl: staleLocalBanner.brandLogoUrl,
    brandLogoSize: staleLocalBanner.brandLogoSize,
    showCopyrightMessage: staleLocalBanner.showCopyrightMessage,
    copyrightText: staleLocalBanner.copyrightText,
    tutorialImageUrl: staleLocalBanner.tutorialImageUrl,
    tutorialImageSize: staleLocalBanner.tutorialImageSize,
    tutorialImageBottomPadding: staleLocalBanner.tutorialImageBottomPadding,
    tutorialImageOpacity: staleLocalBanner.tutorialImageOpacity,
  },
};

const splitForegroundSmokeAsset = {
  id: "split-foreground-smoke-asset",
  name: "Split Foreground",
  fileName: "split-foreground.svg",
  kind: "image",
  mimeType: "image/svg+xml",
  blobPath:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="%2300c2ff"/><circle cx="80" cy="80" r="42" fill="white"/></svg>',
  sizeBytes: 128,
  durationMs: null,
  previewImagePath: null,
  width: 160,
  height: 160,
  category: "",
  tags: ["foreground"],
  updatedAt: Date.now(),
};

const splitBackgroundSmokeAsset = {
  id: "split-background-smoke-asset",
  name: "Split Background",
  fileName: "split-background.svg",
  kind: "image",
  mimeType: "image/svg+xml",
  blobPath:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="%230b1120"/><path d="M0 80 L160 20 V60 L0 120 Z" fill="%2322d3ee" opacity="0.8"/></svg>',
  sizeBytes: 128,
  durationMs: null,
  previewImagePath: null,
  width: 160,
  height: 160,
  category: "",
  tags: ["background"],
  updatedAt: Date.now() - 1,
};

const sharedAudioSmokeAsset = {
  id: "shared-audio-smoke-asset",
  name: "Shared Outro Audio",
  fileName: "shared-outro.wav",
  kind: "audio",
  mimeType: "audio/wav",
  blobPath:
    "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAA",
  sizeBytes: 64,
  durationMs: 18_000,
  previewImagePath: null,
  width: null,
  height: null,
  category: "",
  tags: ["audio"],
  updatedAt: Date.now() - 2,
};

const introSplitDraftState = {
  ...draftState,
  currentDraft: {
    ...draftState.currentDraft,
    name: "Intro Split Draft",
    templateId: "intro_split_thumbnail",
    templateEntries: [
      {
        templateId: "intro_split_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: {
          title: "Intro Split Runtime",
          split_title_side: "left",
          split_partition_points: "(12, 3), (12, 24)",
          split_background_svg_asset_id: splitBackgroundSmokeAsset.id,
          split_background_opacity: "55",
          split_background_scale: "112",
          split_background_x: "-4",
          split_background_y: "6",
          split_foreground_asset_id: splitForegroundSmokeAsset.id,
          split_foreground_scale: "108",
          split_foreground_x: "0",
          split_foreground_y: "0",
          split_type_capsule: "bite",
          title_size: "lg",
          show_grid: "true",
          grid_pattern: "dots",
        },
        borderWidth: 24,
        borderColor: "#22d3ee",
        fontPairId: "share-tech-outfit",
        primaryFontFamily: "'Outfit', sans-serif",
        secondaryFontFamily: "'Share Tech Mono', monospace",
        fontSize: 96,
        brandLogoUrl: null,
        brandLogoSize: 90,
        showCopyrightMessage: true,
        copyrightText: "© LocalM™",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 24,
        tutorialImageOpacity: 100,
      },
    ],
    fieldValues: {
      title: "Intro Split Runtime",
      split_title_side: "left",
      split_partition_points: "(12, 3), (12, 24)",
      split_background_svg_asset_id: splitBackgroundSmokeAsset.id,
      split_background_opacity: "55",
      split_background_scale: "112",
      split_background_x: "-4",
      split_background_y: "6",
      split_foreground_asset_id: splitForegroundSmokeAsset.id,
      split_foreground_scale: "108",
      split_foreground_x: "0",
      split_foreground_y: "0",
      split_type_capsule: "bite",
      title_size: "lg",
      show_grid: "true",
      grid_pattern: "dots",
    },
  },
};

const outroDraftState = {
  ...draftState,
  currentDraft: {
    ...draftState.currentDraft,
    name: "Outro Draft",
    templateId: "outro_thumbnail",
    templateEntries: [
      {
        templateId: "outro_thumbnail",
        themeId: "dark",
        platformId: "landscape_4k",
        fieldValues: {
          title: "Thanks for watching",
          subtitle: "Keep building\nSee you in the next one",
          outro_background_svg_asset_id: splitBackgroundSmokeAsset.id,
          outro_background_opacity: "55",
          outro_background_scale: "118",
          outro_background_x: "8",
          outro_background_y: "-6",
        },
        borderWidth: 24,
        borderColor: "#22d3ee",
        fontPairId: "share-tech-outfit",
        primaryFontFamily: "'Outfit', sans-serif",
        secondaryFontFamily: "'Share Tech Mono', monospace",
        fontSize: 96,
        brandLogoUrl: null,
        brandLogoSize: 90,
        showCopyrightMessage: true,
        copyrightText: "© LocalM™",
        tutorialImageUrl: null,
        tutorialImageSize: 100,
        tutorialImageBottomPadding: 24,
        tutorialImageOpacity: 100,
      },
    ],
    fieldValues: {
      title: "Thanks for watching",
      subtitle: "Keep building\nSee you in the next one",
      outro_background_svg_asset_id: splitBackgroundSmokeAsset.id,
      outro_background_opacity: "55",
      outro_background_scale: "118",
      outro_background_x: "8",
      outro_background_y: "-6",
    },
  },
};

async function mockAzureTableReads(
  page: import("@playwright/test").Page,
  recordsByPartition: Record<string, Array<Record<string, unknown>>> = {},
) {
  await page.route(
    /https:\/\/satutslocalm\.table\.core\.windows\.net\/.*/,
    async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const filter = url.searchParams.get("$filter") ?? "";
        const partitionKey =
          filter.match(/PartitionKey eq '([^']+)'/)?.[1] ?? "";
        await route.fulfill({
          status: 200,
          contentType: "application/json;odata=nometadata",
          body: JSON.stringify({
            value: (recordsByPartition[partitionKey] ?? []).map((record) => ({
              rowKey: record.id,
              data: JSON.stringify(record),
              updatedAt: record.updatedAt,
            })),
          }),
          headers: {
            "x-ms-version": "2023-11-03",
          },
        });
        return;
      }

      await route.fulfill({ status: 204, body: "" });
    },
  );
}

async function seedApp(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({ seededAuthState }) => {
      window.sessionStorage.setItem(
        "localm_intro_outro_auth_state",
        JSON.stringify(seededAuthState),
      );
      window.sessionStorage.setItem(
        "localm_intro_outro_sas_token",
        seededAuthState.sasToken,
      );
    },
    { seededAuthState: authState },
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page.evaluate(async (state) => {
    const loadDatabaseModule = new Function(
      'return import("/src/db/database.ts")',
    ) as () => Promise<{ initDatabase: () => Promise<any> }>;
    const mod = await loadDatabaseModule();
    const db = await mod.initDatabase();
    await db.app_state.upsert(state);
  }, draftState);
}

async function seedStaleLocalBanner(
  page: import("@playwright/test").Page,
  banner = staleLocalBanner,
) {
  await page.evaluate(async (record) => {
    const loadDatabaseModule = new Function(
      'return import("/src/db/database.ts")',
    ) as () => Promise<{ initDatabase: () => Promise<any> }>;
    const mod = await loadDatabaseModule();
    const db = await mod.initDatabase();
    await db.banners.upsert(record);
  }, banner);
}

async function seedDraftState(
  page: import("@playwright/test").Page,
  state: typeof draftState,
) {
  await page.evaluate(async (nextState) => {
    const loadDatabaseModule = new Function(
      'return import("/src/db/database.ts")',
    ) as () => Promise<{ initDatabase: () => Promise<any> }>;
    const mod = await loadDatabaseModule();
    const db = await mod.initDatabase();
    await db.app_state.upsert(nextState);
  }, state);
}

test("launcher cards open the thumbnail and theme tools", async ({ page }) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page
    .getByRole("button", { name: /^Thumbnail Generator/ })
    .click({ timeout: 10_000 });
  await expect(page.getByText("Thumbnail Settings")).toBeVisible();

  await page.getByTestId("home-button").click();
  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page.getByRole("button", { name: /^Theme Generator/ }).click();
  await expect(page.getByText("Theme Generator")).toBeVisible();
});

test("expired stored auth returns the user to the login screen on load", async ({
  page,
}) => {
  await page.route(
    /https:\/\/satutslocalm\.table\.core\.windows\.net\/.*/,
    async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json;odata=nometadata",
        body: JSON.stringify({
          "odata.error": {
            code: "AuthenticationFailed",
            message: {
              lang: "en-US",
              value:
                "Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.",
            },
          },
        }),
      });
    },
  );

  await page.addInitScript(
    ({ seededAuthState }) => {
      window.sessionStorage.setItem(
        "localm_intro_outro_auth_state",
        JSON.stringify(seededAuthState),
      );
      window.sessionStorage.setItem(
        "localm_intro_outro_sas_token",
        seededAuthState.sasToken,
      );
    },
    { seededAuthState: authState },
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByText("Enter Azure Storage credentials to connect."),
  ).toBeVisible();
  await expect(page.getByText(/Please log in again/i)).toBeVisible();
});

test("thumbnail workflow ships without animation controls and redirects legacy animation routes", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Thumbnail Settings")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export Image" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export Motion Video" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export Main PNG" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("slider", { name: "Motion Length" }),
  ).toHaveAttribute("aria-valuenow", "5");
  await expect(
    page.getByRole("button", { name: "Animate As Intro" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Animate As Outro" }),
  ).toHaveCount(0);

  await page.goto("/animation/intro", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/thumbnail$/);
  await expect(page.getByText("Thumbnail Settings")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("thumbnail route keeps local saved banners visible when the remote list is empty", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);
  await seedStaleLocalBanner(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Thumbnail Settings")).toBeVisible();

  await page.getByRole("button", { name: "Load Banner" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", {
      name: new RegExp(staleLocalBanner.name, "i"),
    }),
  ).toBeVisible();
});

test("thumbnail route restores stored per-template values when switching templates inside one banner", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Release Ready Thumbnail")).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Intro (Bite)" }).click();
  await expect(page.getByText("Stored Intro Bite Title")).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Tutorial" }).click();
  await expect(page.getByText("Release Ready Thumbnail")).toBeVisible();
});

test("intro bite, intro split, and outro use the shared audio flow without overlay controls", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Intro (Bite)" }).click();
  await expect(page.getByLabel("Shared Audio Asset")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Asset Library" }),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Intro (Split)" }).click();
  await expect(page.getByLabel("Shared Audio Asset")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Asset Library" }).first(),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Outro", exact: true }).click();
  await expect(page.getByLabel("Shared Audio Asset")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Asset Library" }),
  ).toBeVisible();
  await expect(page.getByText("YouTube Overlay")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Upload YouTube Overlay/i }),
  ).toHaveCount(0);
});

test("outro shared audio starts with a 2 second default offset in the editor", async ({
  page,
}) => {
  const outroAudioDraftState = {
    ...outroDraftState,
    currentDraft: {
      ...outroDraftState.currentDraft,
      templateEntries: [
        {
          ...outroDraftState.currentDraft.templateEntries[0],
          fieldValues: {
            ...outroDraftState.currentDraft.templateEntries[0].fieldValues,
            motion_duration_seconds: "5",
            outro_audio_asset_id: sharedAudioSmokeAsset.id,
          },
        },
      ],
      fieldValues: {
        ...outroDraftState.currentDraft.fieldValues,
        motion_duration_seconds: "5",
        outro_audio_asset_id: sharedAudioSmokeAsset.id,
      },
    },
  };

  await mockAzureTableReads(page, {
    assets: [sharedAudioSmokeAsset, splitBackgroundSmokeAsset],
  });
  await seedApp(page);
  await seedDraftState(page, outroAudioDraftState);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Thanks for watching")).toBeVisible();
  await expect(page.getByLabel("Shared Audio Asset")).toBeVisible();

  const audioStartOffsetSlider = page.getByRole("slider", {
    name: "Audio Start Offset",
  });
  await expect(audioStartOffsetSlider).toBeVisible();
  await expect(audioStartOffsetSlider).toHaveAttribute("aria-valuenow", "2");
  await expect(audioStartOffsetSlider).toHaveAttribute("aria-valuemax", "13");
  await expect(
    page.getByText(/Default is 2s, and the latest safe start point is 13s/i),
  ).toBeVisible();
});

test("thumbnail route keeps saved template field updates after refresh", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Template").click();
  await page.getByRole("option", { name: "Intro (Bite)" }).click();

  await page
    .locator('input[value="Stored Intro Bite Title"]')
    .fill("Persisted Intro Bite Title");
  await page
    .locator('input[value="Stored Source Video"]')
    .fill("Persisted Source Video");
  await page.getByRole("button", { name: "Save Banner" }).click();
  const saveDialog = page.getByRole("dialog");
  await expect(saveDialog).toBeVisible();
  await saveDialog.getByRole("button", { name: "Save New Banner" }).click();
  await expect(
    page.getByText(/Updated "Release Smoke Draft"|Saved "Release Smoke Draft"/),
  ).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Persisted Intro Bite Title")).toBeVisible();
  await expect(
    page.locator('input[value="Persisted Source Video"]'),
  ).toBeVisible();
});

test("save dialog can create a new copy without overwriting the loaded banner", async ({
  page,
}) => {
  await mockAzureTableReads(page, {
    banners: [staleLocalBanner],
  });
  await seedApp(page);
  await seedStaleLocalBanner(page);
  await seedDraftState(page, loadedBannerDraftState);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText(`Loaded: ${staleLocalBanner.name}`),
  ).toBeVisible();

  await page.getByRole("button", { name: "Save Banner" }).click();
  await expect(
    page.getByRole("button", { name: "Save As New Copy" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save As New Copy" }).click();
  await page.getByLabel("Banner Name").fill("Copied Banner");
  await page.getByRole("button", { name: "Save New Banner" }).click();

  await expect(page.getByText("Loaded: Copied Banner")).toBeVisible();

  await page.getByRole("button", { name: "Load Banner" }).click();
  const loadDialog = page.getByRole("dialog");
  await expect(loadDialog).toBeVisible();
  await expect(
    loadDialog.getByRole("button", {
      name: new RegExp(staleLocalBanner.name, "i"),
    }),
  ).toBeVisible();
  await expect(
    loadDialog.getByRole("button", {
      name: /Copied Banner/i,
    }),
  ).toBeVisible();
});

test("new banner starts a fresh unsaved working draft", async ({ page }) => {
  await mockAzureTableReads(page, {
    banners: [staleLocalBanner],
  });
  await seedApp(page);
  await seedStaleLocalBanner(page);
  await seedDraftState(page, loadedBannerDraftState);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText(`Loaded: ${staleLocalBanner.name}`),
  ).toBeVisible();

  await page.getByRole("button", { name: "New Banner" }).click();

  await expect(page.getByText(/Working draft: Untitled/i)).toBeVisible();
  await expect(
    page.locator('input[value="How to Build a REST API"]'),
  ).toBeVisible();
  await expect(page.getByText(staleLocalBanner.name)).toHaveCount(0);
});

test("intro split template exposes split controls and validates partition points", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Template").click();
  await page.getByRole("option", { name: "Intro (Split)" }).click();

  await expect(page.getByLabel("Title Side")).toBeVisible();
  await expect(page.getByLabel("Title Style")).toBeVisible();
  await expect(page.getByLabel("Title Width")).toBeVisible();
  await expect(page.getByLabel("Foreground Image Asset")).toBeVisible();
  await expect(page.getByLabel("Background SVG Asset")).toBeVisible();
  await expect(
    page.locator('input[name="split_partition_points"]'),
  ).toHaveCount(0);

  const showBreakpointsButton = page.getByRole("button", {
    name: "Show Breakpoints",
  });
  await expect(showBreakpointsButton).toBeVisible();
  await showBreakpointsButton.click();
  await expect(page.getByLabel("Point 1 X")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hide Breakpoints" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Show Capsules" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show Capsules" }).click();
  await expect(page.getByLabel("Type Capsule")).toBeVisible();
  await expect(page.getByLabel("Course Title")).toHaveCount(0);

  await page.getByLabel("Type Capsule").click();
  await page.getByRole("option", { name: "Course" }).click();

  await expect(page.getByLabel("Course Title")).toBeVisible();
  await expect(page.getByLabel("Lesson Number")).toBeVisible();
  await expect(page.getByLabel("Total Lessons")).toBeVisible();
  await expect(page.getByLabel("Course Block Size")).toBeVisible();
  await expect(page.getByLabel("Title Block Y")).toBeVisible();
  const introSplitTypeCapsule = page.locator(
    '[data-capsule-kind="split-type"]',
  );
  const introSplitCourseBlock = page.locator(
    '[data-template-region="intro-split-course-block"]',
  );
  await expect(introSplitTypeCapsule).toContainText("Course", {
    timeout: 4000,
  });
  await expect(
    page.locator('[data-template-region="intro-split-type-capsule-row"]'),
  ).toHaveCount(0);
  await expect(
    introSplitCourseBlock.getByText("GitHub Copilot Bootcamp"),
  ).toBeVisible({
    timeout: 4000,
  });
  await expect(
    introSplitCourseBlock.getByText("|", { exact: true }),
  ).toBeVisible({
    timeout: 4000,
  });
  await expect(introSplitCourseBlock.getByText("01 of 10")).toBeVisible({
    timeout: 4000,
  });

  const addQuoteButton = page.getByRole("button", { name: "Add Quote" });
  await expect(addQuoteButton).toBeVisible();
  await addQuoteButton.click();

  await expect(page.getByLabel("Quote Style")).toBeVisible();
  await expect(page.getByLabel("Quote Bold")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Quote Text", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Quote X")).toBeVisible();
  await expect(page.getByLabel("Quote Y")).toBeVisible();
  await expect(page.getByLabel("Quote Text Size")).toBeVisible();
  await expect(page.getByLabel("Quote Mark Size")).toBeVisible();
  await expect(page.getByLabel("Quote Width")).toBeVisible();

  const introSplitQuoteBlock = page.locator(
    '[data-template-region="intro-split-quote-block"]',
  );
  await expect(introSplitQuoteBlock).toContainText("What if your", {
    timeout: 4000,
  });
  await expect(introSplitQuoteBlock).toContainText("before you even", {
    timeout: 4000,
  });
  await expect(introSplitQuoteBlock).toBeVisible();
});

test("thumbnail preview applies setting changes after a debounce window", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Template").click();
  await page.getByRole("option", { name: "Intro (Split)" }).click();

  const debouncedTitle = `Debounced Preview ${Date.now()}`;
  await page.getByLabel("Intro Title").fill(debouncedTitle);

  await expect(page.getByText(debouncedTitle)).toHaveCount(0);
  await expect(page.getByText(debouncedTitle)).toBeVisible({ timeout: 4000 });
});

test("intro split preview renders the seeded foreground asset and updates the document title", async ({
  page,
}) => {
  await mockAzureTableReads(page, {
    assets: [splitForegroundSmokeAsset, splitBackgroundSmokeAsset],
  });
  await seedApp(page);
  await seedDraftState(page, introSplitDraftState);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveTitle(
    "LocalM Media Mods | Intro Outro | Intro (Split)",
  );
  await expect(page.locator('img[alt="Split foreground"]')).toBeVisible();
  await expect(page.locator('img[alt="Split background asset"]')).toBeVisible();
});

test("outro exposes support-line and background asset controls with the template page title", async ({
  page,
}) => {
  await mockAzureTableReads(page, {
    assets: [splitBackgroundSmokeAsset],
  });
  await seedApp(page);
  await seedDraftState(page, outroDraftState);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveTitle("LocalM Media Mods | Intro Outro | Outro");
  await expect(
    page.getByRole("button", { name: "Add Support Line" }),
  ).toBeVisible();
  await expect(page.getByLabel("Headline Background")).toBeVisible();
  await expect(page.getByLabel("Background SVG Asset")).toBeVisible();
  const supportLines = page.locator(
    '[data-template-region="outro-support-lines"]',
  );
  const headlinePanel = page.locator(
    '[data-template-region="outro-headline-panel"]',
  );
  await expect(supportLines.getByText("Keep building")).toBeVisible();
  await expect(supportLines.getByText("See you in the next one")).toBeVisible();

  await page.getByLabel("Headline Background").click();
  await page.getByRole("option", { name: "Glass" }).click();
  await expect(headlinePanel).toHaveAttribute("style", /backdrop-filter:/);

  await page.getByLabel("Support Line").fill("");
  await expect(
    supportLines.getByText("Want more? Subscribe and press the bell"),
  ).toHaveCount(0);
});

test("intro split does not emit out-of-range select warnings for persisted split asset ids", async ({
  page,
}) => {
  const consoleMessages: string[] = [];

  page.on("console", (message) => {
    consoleMessages.push(message.text());
  });

  await mockAzureTableReads(page);
  await seedApp(page);

  await page.evaluate(async () => {
    const loadDatabaseModule = new Function(
      'return import("/src/db/database.ts")',
    ) as () => Promise<{ initDatabase: () => Promise<any> }>;
    const mod = await loadDatabaseModule();
    const db = await mod.initDatabase();
    const record = await db.app_state.findOne("ui_state").exec();

    if (!record) {
      return;
    }

    const nextState = record.toJSON();
    const splitFieldValues = {
      title: "Persisted Split",
      split_title_side: "left",
      split_partition_points: "(12, 3), (12, 24)",
      split_foreground_asset_id: "d0cbb332-e68c-4c28-8957-ca78c31ca108",
      split_background_svg_asset_id: "c0db26a3-fe77-4f19-bc28-f5c973b398b0",
      split_foreground_scale: "108",
      split_foreground_x: "0",
      split_foreground_y: "0",
      split_type_capsule: "bite",
      show_grid: "true",
      grid_pattern: "dots",
    };

    nextState.currentDraft = {
      ...nextState.currentDraft,
      templateId: "intro_split_thumbnail",
      fieldValues: splitFieldValues,
      templateEntries: [
        {
          templateId: "intro_split_thumbnail",
          themeId: nextState.currentDraft.themeId,
          platformId: nextState.currentDraft.platformId,
          fieldValues: splitFieldValues,
          borderWidth: nextState.currentDraft.borderWidth,
          borderColor: nextState.currentDraft.borderColor,
          fontPairId: nextState.currentDraft.fontPairId,
          primaryFontFamily: nextState.currentDraft.primaryFontFamily,
          secondaryFontFamily: nextState.currentDraft.secondaryFontFamily,
          fontSize: nextState.currentDraft.fontSize,
          brandLogoUrl: nextState.currentDraft.brandLogoUrl,
          brandLogoSize: nextState.currentDraft.brandLogoSize,
          showCopyrightMessage: nextState.currentDraft.showCopyrightMessage,
          copyrightText: nextState.currentDraft.copyrightText,
          tutorialImageUrl: nextState.currentDraft.tutorialImageUrl,
          tutorialImageSize: nextState.currentDraft.tutorialImageSize,
          tutorialImageBottomPadding:
            nextState.currentDraft.tutorialImageBottomPadding,
          tutorialImageOpacity: nextState.currentDraft.tutorialImageOpacity,
        },
      ],
    };

    await db.app_state.upsert(nextState);
  });

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Foreground Image Asset")).toBeVisible();

  const outOfRangeWarnings = consoleMessages.filter((entry) =>
    entry.includes("out-of-range value"),
  );
  expect(outOfRangeWarnings).toEqual([]);
});

test("intro split split-asset pickers use tags and icon controls can be shown, hidden, and cleared independently", async ({
  page,
}) => {
  await mockAzureTableReads(page, {
    assets: [
      {
        id: "foreground-asset-1",
        name: "Foreground Subject",
        fileName: "foreground-subject.png",
        kind: "image",
        mimeType: "image/png",
        blobPath: "assets/image/foreground-subject.png",
        sizeBytes: 1024,
        durationMs: null,
        previewImagePath: null,
        width: 800,
        height: 1200,
        category: "",
        tags: ["foreground"],
        updatedAt: 11,
      },
      {
        id: "icon-asset-1",
        name: "Corner Mark",
        fileName: "corner-mark.png",
        kind: "image",
        mimeType: "image/png",
        blobPath: "assets/image/corner-mark.png",
        sizeBytes: 1024,
        durationMs: null,
        previewImagePath: null,
        width: 240,
        height: 240,
        category: "",
        tags: ["icon", "corner"],
        updatedAt: 10,
      },
      {
        id: "background-asset-1",
        name: "Background Shape",
        fileName: "background-shape.png",
        kind: "image",
        mimeType: "image/png",
        blobPath: "assets/image/background-shape.png",
        sizeBytes: 1024,
        durationMs: null,
        previewImagePath: null,
        width: 640,
        height: 360,
        category: "",
        tags: ["background"],
        updatedAt: 9,
      },
      {
        id: "decoy-asset-1",
        name: "Decoy Asset",
        fileName: "decoy.png",
        kind: "image",
        mimeType: "image/png",
        blobPath: "assets/image/decoy.png",
        sizeBytes: 1024,
        durationMs: null,
        previewImagePath: null,
        width: 640,
        height: 360,
        category: "",
        tags: ["misc"],
        updatedAt: 8,
      },
      {
        id: "icon-asset-2",
        name: "Second Corner Mark",
        fileName: "corner-mark-2.png",
        kind: "image",
        mimeType: "image/png",
        blobPath: "assets/image/corner-mark-2.png",
        sizeBytes: 1024,
        durationMs: null,
        previewImagePath: null,
        width: 240,
        height: 240,
        category: "",
        tags: ["icon"],
        updatedAt: 7,
      },
    ],
  });
  await seedApp(page);

  await page.evaluate(async () => {
    const loadDatabaseModule = new Function(
      'return import("/src/db/database.ts")',
    ) as () => Promise<{ initDatabase: () => Promise<any> }>;
    const mod = await loadDatabaseModule();
    const db = await mod.initDatabase();
    const record = await db.app_state.findOne("ui_state").exec();

    if (!record) {
      return;
    }

    const nextState = record.toJSON();
    const splitFieldValues = {
      title: "Split Icon Draft",
      split_title_side: "left",
      split_partition_points: "(12, 3), (12, 24)",
      split_foreground_asset_id: "",
      split_background_svg_asset_id: "",
      split_foreground_scale: "100",
      split_foreground_x: "0",
      split_foreground_y: "0",
      split_type_capsule: "bite",
      split_corner_icon_size: "100",
      show_grid: "true",
      grid_pattern: "dots",
    };

    nextState.currentDraft = {
      ...nextState.currentDraft,
      templateId: "intro_split_thumbnail",
      fieldValues: splitFieldValues,
      templateEntries: [
        {
          templateId: "intro_split_thumbnail",
          themeId: nextState.currentDraft.themeId,
          platformId: nextState.currentDraft.platformId,
          fieldValues: splitFieldValues,
          borderWidth: nextState.currentDraft.borderWidth,
          borderColor: nextState.currentDraft.borderColor,
          fontPairId: nextState.currentDraft.fontPairId,
          primaryFontFamily: nextState.currentDraft.primaryFontFamily,
          secondaryFontFamily: nextState.currentDraft.secondaryFontFamily,
          fontSize: nextState.currentDraft.fontSize,
          brandLogoUrl: nextState.currentDraft.brandLogoUrl,
          brandLogoSize: nextState.currentDraft.brandLogoSize,
          showCopyrightMessage: nextState.currentDraft.showCopyrightMessage,
          copyrightText: nextState.currentDraft.copyrightText,
          tutorialImageUrl: nextState.currentDraft.tutorialImageUrl,
          tutorialImageSize: nextState.currentDraft.tutorialImageSize,
          tutorialImageBottomPadding:
            nextState.currentDraft.tutorialImageBottomPadding,
          tutorialImageOpacity: nextState.currentDraft.tutorialImageOpacity,
        },
      ],
    };

    await db.app_state.upsert(nextState);
  });

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Background SVG Asset")).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const loadDatabaseModule = new Function(
          'return import("/src/db/database.ts")',
        ) as () => Promise<{ initDatabase: () => Promise<any> }>;
        const mod = await loadDatabaseModule();
        const db = await mod.initDatabase();
        const assets = await db.assets.find().exec();
        return assets.length;
      }),
    )
    .toBe(5);

  await page.getByRole("combobox", { name: "Foreground Image Asset" }).click();
  await expect(
    page.getByRole("option", {
      name: /Foreground Subject \[foreground-subject\.png\]/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: /Decoy Asset \[decoy\.png\]/ }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("combobox", { name: "Background SVG Asset" }).click();
  await expect(
    page.getByRole("option", {
      name: /Background Shape \[background-shape\.png\]/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", {
      name: /Foreground Subject \[foreground-subject\.png\]/,
    }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await expect(page.getByRole("button", { name: "Add Icon" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide Icons" })).toHaveCount(0);
  await expect(page.getByLabel("Corner Icon 1")).toHaveCount(0);

  await page.getByRole("button", { name: "Add Icon" }).click();
  await expect(page.getByLabel("Corner Icon 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide Icons" })).toBeVisible();

  await page.getByRole("combobox", { name: "Corner Icon 1" }).click();
  await expect(
    page.getByRole("option", { name: /Corner Mark \[corner-mark\.png\]/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", {
      name: /Background Shape \[background-shape\.png\]/,
    }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Remove Icon 1" }).click();
  await expect(page.getByLabel("Corner Icon 1")).toBeVisible();

  await page.getByRole("button", { name: "Hide Icons" }).click();
  await expect(page.getByLabel("Corner Icon 1")).toHaveCount(0);
});

test("style controls allow increasing font size up to 120", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  const fontSizeSlider = page.getByRole("slider", { name: "Font Size" });
  await expect(fontSizeSlider).toBeVisible();
  await expect(fontSizeSlider).toHaveAttribute("aria-valuemax", "120");
});

test("thumbnail keyboard shortcuts undo, redo, and save with sync", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  const titleInput = page.locator('input[value="Release Ready Thumbnail"]');
  await titleInput.fill("Shortcut Saved Title");
  await page.getByText("Thumbnail Settings").click();

  await page.keyboard.press("Control+Z");
  await expect(
    page.locator('input[value="Release Ready Thumbnail"]'),
  ).toBeVisible();

  await page.keyboard.press("Control+Y");
  await expect(
    page.locator('input[value="Shortcut Saved Title"]'),
  ).toBeVisible();

  await page.keyboard.press("Control+S");
  await expect(
    page.getByText(/Updated "Release Smoke Draft"|Saved "Release Smoke Draft"/),
  ).toBeVisible();

  await page.getByText("Thumbnail Settings").click();
  await page.getByRole("button", { name: "Sync" }).click();
  await expect(page.getByText("Sync completed successfully.")).toBeVisible();
  await expect(page.getByText(/Last sync: (?!Never)/)).toBeVisible();
});
