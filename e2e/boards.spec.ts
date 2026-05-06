import { test, expect } from "@playwright/test";

const TEST_EMAIL = "boards-e2e@velora-e2e.test";
const TEST_PASSWORD = "e2epassword123";

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/boards/, { timeout: 15_000 });
}

test.describe("Boards", () => {
    test.beforeAll(async ({ browser }) => {
        // Create the test account once
        const page = await browser.newPage();
        await page.goto("/signup");
        await page.getByLabel("Full Name").fill("Boards E2E");
        await page.getByLabel("Email").fill(TEST_EMAIL);
        await page.getByLabel("Password").fill(TEST_PASSWORD);
        await page.getByRole("button", { name: "Create Account" }).click();
        await page.waitForURL(/\/boards/, { timeout: 15_000 });
        await page.close();
    });

    test("boards page shows create board card", async ({ page }) => {
        await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
        await expect(page.getByText("Create New Board")).toBeVisible();
    });

    test("can create a new board", async ({ page }) => {
        await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

        await page.getByText("Create New Board").click();
        await page.waitForURL(/\/boards\/new/);

        await page.getByPlaceholder(/board name/i).fill("My E2E Board");
        await page.getByRole("button", { name: /create/i }).click();

        await page.waitForURL(/\/board\//, { timeout: 10_000 });
        await expect(page.getByText("My E2E Board")).toBeVisible();
    });

    test("board page shows columns", async ({ page }) => {
        await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

        // Navigate to the first board
        await page.getByText("My E2E Board").click();
        await page.waitForURL(/\/board\//);

        // Default columns should exist
        await expect(page.getByText("To Do")).toBeVisible();
    });

    test("can add a task", async ({ page }) => {
        await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
        await page.getByText("My E2E Board").click();
        await page.waitForURL(/\/board\//);

        await page.getByRole("button", { name: /add task/i }).first().click();
        await page.getByPlaceholder(/task/i).fill("My test task");
        await page.getByRole("button", { name: /add/i }).click();

        await expect(page.getByText("My test task")).toBeVisible({ timeout: 5_000 });
    });
});
