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

  await expect(page.getByText("Thumbnail Generator")).toBeVisible();
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

test("thumbnail route restores stored per-template values when switching templates inside one banner", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Release Ready Thumbnail")).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Intro Bite" }).click();
  await expect(page.getByText("Stored Intro Bite Title")).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Tutorial" }).click();
  await expect(page.getByText("Release Ready Thumbnail")).toBeVisible();
});

test("intro bite and outro use the shared audio flow without overlay controls", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Intro Bite" }).click();
  await expect(page.getByLabel("Shared Audio Asset")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Asset Library" }),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Outro" }).click();
  await expect(page.getByLabel("Shared Audio Asset")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Asset Library" }),
  ).toBeVisible();
  await expect(page.getByText("YouTube Overlay")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Upload YouTube Overlay/i }),
  ).toHaveCount(0);
});

test("thumbnail route keeps saved template field updates after refresh", async ({
  page,
}) => {
  await mockAzureTableReads(page);
  await seedApp(page);

  await page.goto("/thumbnail", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Template").click();
  await page.getByRole("option", { name: "Intro Bite" }).click();

  await page
    .locator('input[value="Stored Intro Bite Title"]')
    .fill("Persisted Intro Bite Title");
  await page
    .locator('input[value="Stored Source Video"]')
    .fill("Persisted Source Video");
  await page.getByRole("button", { name: "Save Banner" }).click();
  await page.getByRole("button", { name: "Save Banner" }).click();
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
