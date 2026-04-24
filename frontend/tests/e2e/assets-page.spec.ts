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

async function mockAzureTableReads(page: import("@playwright/test").Page) {
  const assets: Array<Record<string, unknown>> = [];

  await page.route(
    /https:\/\/satutslocalm\.table\.core\.windows\.net\/.*/,
    async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json;odata=nometadata",
          body: JSON.stringify({
            value: assets.map((asset) => ({
              rowKey: asset.id,
              data: JSON.stringify(asset),
              updatedAt: asset.updatedAt,
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

  return {
    setAssets(nextAssets: Array<Record<string, unknown>>) {
      assets.splice(0, assets.length, ...nextAssets);
    },
  };
}

async function seedAuth(page: import("@playwright/test").Page) {
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
}

test("launcher opens the shared asset library page", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await mockAzureTableReads(page);
  await seedAuth(page);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page.getByRole("button", { name: /^Asset Library/ }).click();

  await expect(page.getByText("Asset Library")).toBeVisible();
  await expect(page.getByText("Upload Assets")).toBeVisible();
  await expect(page.getByText("Asset Management")).toBeVisible();
  await expect(page.getByLabel("Search Assets")).toBeVisible();
  await expect(page.getByText(/Use #tags with free text/i)).toBeVisible();
  await expect(page.getByText("Filter by Tags")).toBeVisible();
  await expect(page.getByText("Filter by Type")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Clear Filters" }),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("asset management uses a collapsible upload panel and edit dialog cards", async ({
  page,
}) => {
  const tableMock = await mockAzureTableReads(page);
  tableMock.setAssets([
    {
      id: "asset-1",
      name: "Intro Sting",
      fileName: "intro.mp3",
      kind: "audio",
      mimeType: "audio/mpeg",
      blobPath: "assets/audio/intro.mp3",
      sizeBytes: 2048,
      durationMs: 42000,
      previewImagePath: null,
      width: null,
      height: null,
      category: "marketing",
      tags: ["music", "intro"],
      updatedAt: 42,
    },
  ]);
  await seedAuth(page);

  await page.goto("/assets", { waitUntil: "domcontentloaded" });

  await page.getByText("Upload Assets").click();
  await expect(page.getByLabel("Display Name")).toBeHidden();

  await expect(page.locator("text=Intro Sting").first()).toBeVisible();
  await expect(page.locator("text=/^Category:/").first()).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit Asset" })).toBeVisible();

  await page.getByRole("button", { name: "Edit Asset" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Asset" });
  await expect(editDialog).toBeVisible();
  await expect(editDialog.getByLabel("Category")).toHaveCount(0);
  await expect(editDialog.getByLabel("Tags")).toBeVisible();
});

test("asset management surfaces existing tags as suggestions without category controls", async ({
  page,
}) => {
  const tableMock = await mockAzureTableReads(page);
  tableMock.setAssets([
    {
      id: "asset-1",
      name: "Background Shape",
      fileName: "background-shape.png",
      kind: "image",
      mimeType: "image/png",
      blobPath: "assets/image/background-shape.png",
      sizeBytes: 2048,
      durationMs: null,
      previewImagePath: null,
      width: 640,
      height: 360,
      category: "background-asset",
      tags: ["glow", "split"],
      updatedAt: 42,
    },
    {
      id: "asset-2",
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
      category: "icon",
      tags: ["corner", "split"],
      updatedAt: 41,
    },
  ]);
  await seedAuth(page);

  await page.goto("/assets", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Categories")).toHaveCount(0);
  await expect(page.getByLabel("Category")).toHaveCount(0);

  const tagsInput = page.getByRole("combobox", { name: "Tags" }).first();
  await tagsInput.fill("g");
  await expect(page.getByRole("option", { name: "glow" })).toBeVisible();
  await tagsInput.fill("s");
  await expect(page.getByRole("option", { name: "split" })).toBeVisible();
});

test("asset grid shows five cards in the first row on wide screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1900, height: 1200 });
  const tableMock = await mockAzureTableReads(page);
  tableMock.setAssets(
    Array.from({ length: 6 }, (_, index) => ({
      id: `asset-${index + 1}`,
      name: `Grid Asset ${index + 1}`,
      fileName: `grid-${index + 1}.png`,
      kind: "image",
      mimeType: "image/png",
      blobPath: `assets/image/grid-${index + 1}.png`,
      sizeBytes: 1024 + index,
      durationMs: null,
      previewImagePath: null,
      width: 320,
      height: 180,
      category: index % 2 === 0 ? "icon" : "background-asset",
      tags: ["grid"],
      updatedAt: 100 - index,
    })),
  );
  await seedAuth(page);

  await page.goto("/assets", { waitUntil: "domcontentloaded" });

  const nameLocators = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      page
        .getByText(`Grid Asset ${index + 1}`)
        .first()
        .boundingBox(),
    ),
  );

  for (const box of nameLocators) {
    expect(box).not.toBeNull();
  }

  const boxes = nameLocators as Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  const firstRowY = Math.round(boxes[0].y);

  for (const box of boxes.slice(0, 5)) {
    expect(Math.abs(Math.round(box.y) - firstRowY)).toBeLessThan(8);
  }

  expect(boxes[5].y).toBeGreaterThan(firstRowY + 24);
});
