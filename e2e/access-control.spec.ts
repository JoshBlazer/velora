import { test, expect, type Page } from "@playwright/test";
import {
    BOARDS_EMAIL,
    BOARDS_PASSWORD,
    OUTSIDER_EMAIL,
    OUTSIDER_PASSWORD,
} from "./global-setup";

async function loginAs(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/boards/, { timeout: 15_000 });
}

/**
 * Board authorisation had no test coverage at all, despite being the part of
 * the app where a mistake leaks one customer's data to another.
 */
test.describe("Board access control", () => {
    let boardId: string;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await loginAs(page, BOARDS_EMAIL, BOARDS_PASSWORD);

        await page.goto("/boards/new");
        await page.getByLabel("Board Name").fill("Private Board");
        await page.getByRole("button", { name: /create/i }).click();
        await page.waitForURL(/\/board\//, { timeout: 15_000 });

        boardId = page.url().split("/board/")[1];
        await page.close();
    });

    test("an unauthenticated request to the board API is rejected", async ({ request }) => {
        const res = await request.get(`/api/boards/${boardId}`);
        expect(res.status()).toBe(401);
    });

    test("a signed-in stranger cannot read another user's board via the API", async ({ page }) => {
        await loginAs(page, OUTSIDER_EMAIL, OUTSIDER_PASSWORD);

        const res = await page.request.get(`/api/boards/${boardId}`);
        // 404 rather than 403: existence itself should not be confirmed.
        expect(res.status()).toBe(404);
    });

    test("a signed-in stranger cannot open another user's board page", async ({ page }) => {
        await loginAs(page, OUTSIDER_EMAIL, OUTSIDER_PASSWORD);

        await page.goto(`/board/${boardId}`);
        await expect(page.getByText("Private Board")).toHaveCount(0);
    });

    test("a signed-in stranger cannot write to another user's board", async ({ page }) => {
        await loginAs(page, OUTSIDER_EMAIL, OUTSIDER_PASSWORD);

        const res = await page.request.post("/api/columns", {
            data: { boardId, title: "Injected column" },
        });
        expect(res.ok()).toBe(false);
    });

    test("the owner can still read their own board", async ({ page }) => {
        await loginAs(page, BOARDS_EMAIL, BOARDS_PASSWORD);

        const res = await page.request.get(`/api/boards/${boardId}`);
        expect(res.status()).toBe(200);
    });
});
