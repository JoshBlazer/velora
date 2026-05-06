import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
    try {
        if (!rateLimit(`reset-password:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { token, password } = parsed.data;

        const record = await prisma.verificationToken.findUnique({ where: { token } });

        if (!record || !record.identifier.startsWith("reset:")) {
            return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
        }

        if (record.expires < new Date()) {
            await prisma.verificationToken.delete({ where: { token } });
            return NextResponse.json({ error: "This reset link has expired. Request a new one." }, { status: 400 });
        }

        const email = record.identifier.replace("reset:", "");

        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!user) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const hashed = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({ where: { email }, data: { password: hashed } }),
            prisma.verificationToken.delete({ where: { token } }),
        ]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
