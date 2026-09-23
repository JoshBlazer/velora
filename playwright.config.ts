import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    globalSetup: "./e2e/global-setup.ts",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: "list",
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        // In CI, serve a production build. `next dev` compiles each route on
        // first request, so the first hit to /signup or /login routinely took
        // longer than the 15s test timeout while the same route answered in
        // ~1s once warm -- tests failed or passed depending on which one paid
        // the compile cost. A prebuilt server has no cold-compile step.
        command: process.env.CI
            ? "npm run build && npm start -- --port 3001"
            : "npm run dev -- --port 3001",
        url: "http://localhost:3001",
        reuseExistingServer: true,
        timeout: process.env.CI ? 240_000 : 60_000,
    },
});
