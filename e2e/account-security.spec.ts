import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { BOARDS_EMAIL, BOARDS_PASSWORD } from "./global-setup";

/**
 * Account security behaviour that is invisible in the UI and easy to lose in a
 * refactor: a password change has to invalidate sessions issued before it, and
 * deleting an account has to require the password rather than just a session.
 */

const NEW_PASSWORD = "rotated-password-123";

async function loginAs(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/boards/, { timeout: 15_000 });
}

async function signedInAs(request: APIRequestContext): Promise<string | null> {
    const res = await request.get("/api/auth/session");
    const body = await res.json().catch(() => null);
    return body?.user?.email ?? null;
}

test.describe("Account security", () => {
    test("changing the password signs existing sessions out", async ({ page }) => {
        await loginAs(page, BOARDS_EMAIL, BOARDS_PASSWORD);
        expect(await signedInAs(page.request)).toBe(BOARDS_EMAIL);

        const change = await page.request.patch("/api/user/password", {
            data: { currentPassword: BOARDS_PASSWORD, newPassword: NEW_PASSWORD },
        });
        expect(change.ok()).toBe(true);

        // The session that made the change is itself no longer valid: the
        // whole point is that a password change revokes what came before it.
        expect(await signedInAs(page.request)).toBeNull();

        // Put it back so the rest of the suite still has its account, and
        // check the rotated password is what actually works now.
        await loginAs(page, BOARDS_EMAIL, NEW_PASSWORD);
        const restore = await page.request.patch("/api/user/password", {
            data: { currentPassword: NEW_PASSWORD, newPassword: BOARDS_PASSWORD },
        });
        expect(restore.ok()).toBe(true);
    });

    test("a wrong current password is refused", async ({ page }) => {
        await loginAs(page, BOARDS_EMAIL, BOARDS_PASSWORD);

        const res = await page.request.patch("/api/user/password", {
            data: { currentPassword: "not-the-password", newPassword: "irrelevant-12345" },
        });

        expect(res.status()).toBe(400);
        // Still signed in: a failed attempt must not revoke anything.
        expect(await signedInAs(page.request)).toBe(BOARDS_EMAIL);
    });

    test("deleting an account requires the password", async ({ page }) => {
        await loginAs(page, BOARDS_EMAIL, BOARDS_PASSWORD);

        const noPassword = await page.request.delete("/api/user");
        expect(noPassword.status()).toBe(400);

        const wrongPassword = await page.request.delete("/api/user", {
            data: { password: "not-the-password" },
        });
        expect(wrongPassword.status()).toBe(400);

        // The account survived both attempts.
        expect(await signedInAs(page.request)).toBe(BOARDS_EMAIL);
    });

    test("an unauthenticated request cannot delete an account", async ({ request }) => {
        const res = await request.delete("/api/user", { data: { password: BOARDS_PASSWORD } });
        expect(res.status()).toBe(401);
    });
});
