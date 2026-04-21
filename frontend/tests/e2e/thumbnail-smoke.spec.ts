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
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: {
      title: "Release Ready Thumbnail",
      subtitle: "Smoke test",
      badge: "Tutorial",
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

async function mockAzureTableReads(page: import("@playwright/test").Page) {
  await page.route(
    /https:\/\/satutslocalm\.table\.core\.windows\.net\/.*/,
    async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json;odata=nometadata",
          body: JSON.stringify({ value: [] }),
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

test("launcher cards open the thumbnail and theme tools", async ({ page }) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page
    .getByRole("button", { name: /^Thumbnail Generator/ })
    .click({ timeout: 10_000 });
  await expect(page.getByText("Thumbnail Generator")).toBeVisible();

  await page.getByTestId("home-button").click();
  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page.getByRole("button", { name: /^Theme Generator/ }).click();
  await expect(page.getByText("Theme Generator")).toBeVisible();
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

  await expect(page.getByText("Thumbnail Generator")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export Main PNG" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Animate As Intro" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Animate As Outro" }),
  ).toHaveCount(0);

  await page.goto("/animation/intro", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/thumbnail$/);
  await expect(page.getByText("Thumbnail Generator")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("thumbnail route ignores stale local cached banners and reloads server state", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);
  await seedStaleLocalBanner(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Thumbnail Settings")).toBeVisible();

  await page.getByRole("button", { name: "Load Banner" }).click();
  await expect(page.getByText(staleLocalBanner.name)).toHaveCount(0);
});
