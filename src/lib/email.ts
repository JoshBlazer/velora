// Resend refuses to send from a domain the account has not verified, so this
// has to be configurable. Hardcoding velora.app meant any deployment on
// another domain silently failed to send -- and since login requires a
// verified address, that is an app nobody can get into.
const FROM = process.env.EMAIL_FROM || "Velora <noreply@velora.app>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const API_KEY = process.env.RESEND_API_KEY;

/**
 * Escapes a value before it goes into an email body.
 *
 * Display names, board titles and task text are free-form user input, and
 * these templates are HTML. Interpolating them raw let anyone put markup --
 * including links -- into mail sent from our own domain. For invites the
 * sender also chooses the recipient, which made it a usable phishing relay.
 */
function esc(value: string | null | undefined): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Cleans a user value destined for a subject line.
 *
 * A subject is plain text, so HTML-escaping it would just show "&amp;" to the
 * reader. What it does need is line breaks removed, so the value cannot run on
 * into another mail header, plus a length cap.
 */
function subjectSafe(value: string | null | undefined, max = 80): string {
    const cleaned = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
    return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

async function send(to: string, subject: string, html: string) {
    if (!API_KEY) {
        console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to}`);
        return;
    }

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });

    if (!res.ok) {
        const body = await res.text();
        console.error(`[email] Resend error ${res.status}: ${body}`);
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const url = `${APP_URL}/reset-password?token=${token}`;
    await send(
        email,
        "Reset your Velora password",
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#cbd5e1;border-radius:12px;">
            <h1 style="color:#22d3ee;font-size:24px;margin-bottom:8px;">Reset your password</h1>
            <p style="margin-bottom:24px;">Someone requested a password reset for your Velora account. If that wasn't you, ignore this email — your password hasn't changed.</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#f472b6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
            <p style="margin-top:24px;font-size:12px;color:#64748b;">Link expires in 1 hour. If it doesn't work, copy this URL: ${url}</p>
        </div>`
    );
}

export async function sendVerificationEmail(email: string, name: string | null, token: string) {
    const url = `${APP_URL}/verify-email?token=${token}`;
    await send(
        email,
        "Verify your Velora email",
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#cbd5e1;border-radius:12px;">
            <h1 style="color:#22d3ee;font-size:24px;margin-bottom:8px;">Welcome to Velora${name ? `, ${esc(name)}` : ""}!</h1>
            <p style="margin-bottom:24px;">Verify your email to make sure you can always get back into your account.</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#f472b6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a>
            <p style="margin-top:24px;font-size:12px;color:#64748b;">Link expires in 24 hours. If it doesn't work, copy this URL: ${url}</p>
        </div>`
    );
}

export async function sendBoardInviteEmail(
    email: string,
    inviterName: string | null,
    boardTitle: string,
    token: string
) {
    const url = `${APP_URL}/invite/${token}`;
    await send(
        email,
        `${subjectSafe(inviterName) || "Someone"} invited you to a Velora board`,
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#cbd5e1;border-radius:12px;">
            <h1 style="color:#22d3ee;font-size:24px;margin-bottom:8px;">Board invite</h1>
            <p style="margin-bottom:24px;"><strong style="color:#fff;">${esc(inviterName) || "A teammate"}</strong> invited you to collaborate on <strong style="color:#fff;">${esc(boardTitle)}</strong> in Velora.</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#f472b6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invite</a>
            <p style="margin-top:24px;font-size:12px;color:#64748b;">Link expires in 48 hours. If it doesn't work, copy this URL: ${url}</p>
        </div>`
    );
}

export async function sendDueDateReminderEmail(
    email: string,
    name: string | null,
    tasks: { content: string; boardTitle: string; dueDate: Date }[]
) {
    const taskRows = tasks
        .map(
            (t) =>
                `<tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;color:#fff;">${esc(t.content)}</td><td style="padding:8px 0;border-bottom:1px solid #1e293b;color:#94a3b8;text-align:right;">${esc(t.boardTitle)}</td></tr>`
        )
        .join("");

    await send(
        email,
        `You have ${tasks.length} task${tasks.length === 1 ? "" : "s"} due soon`,
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#cbd5e1;border-radius:12px;">
            <h1 style="color:#22d3ee;font-size:24px;margin-bottom:8px;">Due date reminder</h1>
            <p style="margin-bottom:24px;">Hey${name ? ` ${esc(name)}` : ""}, the following task${tasks.length === 1 ? "" : "s"} ${tasks.length === 1 ? "is" : "are"} due within the next 24 hours:</p>
            <table style="width:100%;border-collapse:collapse;">${taskRows}</table>
            <a href="${APP_URL}/boards" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#22d3ee,#f472b6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open Velora</a>
        </div>`
    );
}
