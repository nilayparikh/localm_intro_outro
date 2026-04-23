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
  await mockAzureTableReads(page);
  await seedAuth(page);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Choose a Tool")).toBeVisible();

  await page.getByRole("button", { name: /^Asset Library/ }).click();

  await expect(page.getByText("Asset Library")).toBeVisible();
  await expect(page.getByText("Upload Assets")).toBeVisible();
  await expect(page.getByText("Asset Management")).toBeVisible();
});
