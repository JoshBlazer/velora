import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Board titles and display names are free-form user input that gets rendered
 * into HTML email sent from our own domain -- and for invites the sender also
 * chooses the recipient. Interpolating them raw made that a usable phishing
 * relay, so these assert the escaping stays in place.
 */

const fetchMock = vi.fn();

function lastSentBody() {
    const [, init] = fetchMock.mock.calls.at(-1)!;
    return JSON.parse((init as RequestInit).body as string);
}

beforeEach(() => {
    vi.resetModules();
    process.env.RESEND_API_KEY = "test-key";
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
});

const INJECTION = '</strong><a href="https://evil.example">Claim your prize</a><strong>';

describe("invite email", () => {
    it("escapes a board title containing markup", async () => {
        const { sendBoardInviteEmail } = await import("@/lib/email");
        await sendBoardInviteEmail("victim@example.com", "Mallory", INJECTION, "tok");

        const { html } = lastSentBody();
        expect(html).not.toContain("<a href=\"https://evil.example\"");
        expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
    });

    it("escapes an inviter display name containing markup", async () => {
        const { sendBoardInviteEmail } = await import("@/lib/email");
        await sendBoardInviteEmail("victim@example.com", INJECTION, "Board", "tok");

        const { html } = lastSentBody();
        expect(html).not.toContain("<a href=\"https://evil.example\"");
    });

    it("keeps the subject as plain text and strips newlines", async () => {
        const { sendBoardInviteEmail } = await import("@/lib/email");
        await sendBoardInviteEmail("victim@example.com", "Sam\r\nBcc: someone@else", "Board", "tok");

        const { subject } = lastSentBody();
        expect(subject).not.toContain("\n");
        expect(subject).not.toContain("\r");
        // A subject is not HTML, so it should not be HTML-escaped either.
        expect(subject).not.toContain("&amp;");
    });
});

describe("other templates", () => {
    it("escapes the display name in the verification email", async () => {
        const { sendVerificationEmail } = await import("@/lib/email");
        await sendVerificationEmail("user@example.com", INJECTION, "tok");

        expect(lastSentBody().html).not.toContain("<a href=\"https://evil.example\"");
    });

    it("escapes task content in the reminder email", async () => {
        const { sendDueDateReminderEmail } = await import("@/lib/email");
        await sendDueDateReminderEmail("user@example.com", "Sam", [
            { content: INJECTION, boardTitle: "Board", dueDate: new Date() },
        ]);

        expect(lastSentBody().html).not.toContain("<a href=\"https://evil.example\"");
    });

    it("sends nothing at all when no API key is configured", async () => {
        delete process.env.RESEND_API_KEY;
        vi.resetModules();

        const { sendVerificationEmail } = await import("@/lib/email");
        await sendVerificationEmail("user@example.com", "Sam", "tok");

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
