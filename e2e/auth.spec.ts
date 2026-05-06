import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test-${Date.now()}@velora-e2e.test`;
const TEST_PASSWORD = "e2epassword123";
const TEST_NAME = "E2E User";

test.describe("Auth flow", () => {
    test("unauthenticated user is redirected from /boards to /login", async ({ page }) => {
        await page.goto("/boards");
        await expect(page).toHaveURL(/\/login/);
    });

    test("signup creates account and redirects to /boards", async ({ page }) => {
        await page.goto("/signup");

        await page.getByLabel("Full Name").fill(TEST_NAME);
        await page.getByLabel("Email").fill(TEST_EMAIL);
        await page.getByLabel("Password").fill(TEST_PASSWORD);
        await page.getByRole("button", { name: "Create Account" }).click();

        await expect(page).toHaveURL(/\/boards/, { timeout: 15_000 });
    });

    test("login with valid credentials redirects to /boards", async ({ page }) => {
        await page.goto("/login");

        await page.getByLabel("Email").fill(TEST_EMAIL);
        await page.getByLabel("Password").fill(TEST_PASSWORD);
        await page.getByRole("button", { name: "Sign In" }).click();

        await expect(page).toHaveURL(/\/boards/, { timeout: 15_000 });
    });

    test("login with wrong password shows error", async ({ page }) => {
        await page.goto("/login");

        await page.getByLabel("Email").fill(TEST_EMAIL);
        await page.getByLabel("Password").fill("wrongpassword");
        await page.getByRole("button", { name: "Sign In" }).click();

        await expect(page.getByText("Invalid email or password")).toBeVisible({ timeout: 5_000 });
    });

    test("forgot password page renders", async ({ page }) => {
        await page.goto("/forgot-password");
        await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    });

    test("reset-password with no token shows expired state", async ({ page }) => {
        await page.goto("/reset-password");
        await expect(page.getByText("Link expired or invalid")).toBeVisible();
    });

    test("verify-email with no token shows expired state", async ({ page }) => {
        await page.goto("/verify-email");
        await expect(page.getByText("Link expired or invalid")).toBeVisible();
    });

    test("logged-in user is redirected away from /login", async ({ page }) => {
        // Log in first
        await page.goto("/login");
        await page.getByLabel("Email").fill(TEST_EMAIL);
        await page.getByLabel("Password").fill(TEST_PASSWORD);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page).toHaveURL(/\/boards/, { timeout: 15_000 });

        // Now try to visit /login again
        await page.goto("/login");
        await expect(page).toHaveURL(/\/boards/);
    });
});
