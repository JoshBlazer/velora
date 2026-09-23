/**
 * Next runs this once per server process, before handling any request, which
 * makes it the right place to refuse to start on a broken configuration.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { checkEnv } = await import("@/lib/env-check");
        checkEnv();
    }
}
