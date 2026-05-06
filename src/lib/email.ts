const FROM = "Velora <noreply@velora.app>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const API_KEY = process.env.RESEND_API_KEY;

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
            <h1 style="color:#22d3ee;font-size:24px;margin-bottom:8px;">Welcome to Velora${name ? `, ${name}` : ""}!</h1>
            <p style="margin-bottom:24px;">Verify your email to make sure you can always get back into your account.</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#f472b6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a>
            <p style="margin-top:24px;font-size:12px;color:#64748b;">Link expires in 24 hours. If it doesn't work, copy this URL: ${url}</p>
        </div>`
    );
}
