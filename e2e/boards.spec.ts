import { test, expect } from "@playwright/test";
import { BOARDS_EMAIL, BOARDS_PASSWORD } from "./global-setup";

const TEST_EMAIL = BOARDS_EMAIL;
const TEST_PASSWORD = BOARDS_PASSWORD;

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/boards/, { timeout: 15_000 });
}

test.describe("Boards", () => {
    // The account is seeded in global-setup, not created through the signup
    // UI: a beforeAll signup re-runs on every retry and exhausts the signup
    // rate limit, after which the account never exists and each login hangs
    // on /login.

    test("boards page shows create board card", async ({ page }) => {
        await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
        await expect(page.getByText("Create New Board")).toBeVisible();
    });

    test("can create a new board", async ({ page }) => {
        await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

        await page.getByText("Create New Board").click();
        await page.waitForURL(/\/boards\/new/);

        await page.getByLabel("Board Name").fill("My E2E Board");
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

        // /task/i also matches the "Search tasks..." filter box, and /add/i
        // also matches every column's "Add Task" button, so both locators
        // have to be specific enough to resolve to one element.
        await page.getByRole("button", { name: /add task/i }).first().click();
        await page.getByPlaceholder(/enter task description/i).fill("My test task");
        await page.getByRole("button", { name: "Add", exact: true }).click();

        await expect(page.getByText("My test task")).toBeVisible({ timeout: 5_000 });
    });
});
