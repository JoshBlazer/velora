/**
 * Startup validation of the environment.
 *
 * Each of these used to fail silently and late:
 *
 *   - no RESEND_API_KEY: verification mail is skipped with a console warning,
 *     and since login now requires a verified address, nobody who signs up can
 *     ever get in. The app looks fine and is unusable.
 *   - no CRON_SECRET: the reminders route refuses every request, so the daily
 *     job in vercel.json does nothing, forever, without complaint.
 *   - no UPSTASH_REDIS_*: rate limiting falls back to a per-instance counter
 *     that resets on cold start, so the limits protecting login are decorative.
 *
 * Failing at boot is better than any of those. Only production is checked, so
 * local development and CI are unaffected.
 */

interface Requirement {
    name: string;
    consequence: string;
}

const REQUIRED: Requirement[] = [
    { name: "DATABASE_URL", consequence: "the app cannot reach its database" },
    { name: "AUTH_SECRET", consequence: "sessions cannot be signed" },
    { name: "APP_URL", consequence: "links in outgoing email point at localhost" },
];

const REQUIRED_UNLESS_VERIFICATION_DISABLED: Requirement[] = [
    {
        name: "RESEND_API_KEY",
        consequence:
            "verification email cannot be sent, and login requires a verified " +
            "address -- no new account would ever be able to sign in",
    },
];

const RECOMMENDED: Requirement[] = [
    {
        name: "CRON_SECRET",
        consequence: "the reminders endpoint rejects every request, so due-date email never sends",
    },
    {
        name: "UPSTASH_REDIS_REST_URL",
        consequence: "rate limits fall back to a per-instance counter and will not hold",
    },
];

export function checkEnv() {
    if (process.env.NODE_ENV !== "production") return;

    // The E2E suite serves a production build to test against, but it is not
    // serving users and has no mail provider. This is the only intended use;
    // setting it on a real deployment just restores the silent failures above.
    if (process.env.SKIP_ENV_VALIDATION === "true") {
        console.warn("[env] SKIP_ENV_VALIDATION is set -- configuration checks bypassed.");
        return;
    }

    const missing = [...REQUIRED];

    if (process.env.REQUIRE_EMAIL_VERIFICATION !== "false") {
        missing.push(...REQUIRED_UNLESS_VERIFICATION_DISABLED);
    }

    const absent = missing.filter((r) => !process.env[r.name]);

    if (absent.length > 0) {
        const detail = absent.map((r) => `  - ${r.name}: ${r.consequence}`).join("\n");
        throw new Error(
            `Refusing to start. Missing required environment variables:\n${detail}\n` +
            `See .env.example. Set REQUIRE_EMAIL_VERIFICATION=false only if you ` +
            `intend to let unverified addresses sign in.`
        );
    }

    for (const { name, consequence } of RECOMMENDED) {
        if (!process.env[name]) {
            console.warn(`[env] ${name} is not set -- ${consequence}.`);
        }
    }
}
