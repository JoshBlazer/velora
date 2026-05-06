import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
    email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
    try {
        if (!rateLimit(`forgot-password:${getClientIp(request)}`, 3, 60 * 60 * 1000)) {
            return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { email } = parsed.data;

        // Always return success to avoid leaking whether an email exists
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

        if (user) {
            const token = randomBytes(32).toString("hex");
            const identifier = `reset:${email}`;
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Remove any existing reset tokens for this email
            await prisma.verificationToken.deleteMany({ where: { identifier } });

            await prisma.verificationToken.create({
                data: { identifier, token, expires },
            });

            // Fire and forget — don't block the response on email delivery
            sendPasswordResetEmail(email, token).catch((err) =>
                console.error("[forgot-password] email send failed:", err)
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
