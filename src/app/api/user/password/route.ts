import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { hasAllowance, recordAttempt, clearAttempts } from "@/lib/rate-limit";

// This endpoint compares a supplied password against the stored hash, so with
// no limit a stolen session is an unlimited oracle for guessing the current
// password. Each guess also costs a bcrypt round, which makes it a cheap way
// to burn server CPU.
const CHANGE_WINDOW_MS = 15 * 60 * 1000;
const CHANGE_MAX_FAILURES = 10;

const schema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const throttleKey = `password-change:${session.user.id}`;
    if (!await hasAllowance(throttleKey, CHANGE_MAX_FAILURES)) {
        return NextResponse.json(
            { error: "Too many attempts. Try again later." },
            { status: 429 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
    });

    if (!user?.password) {
        return NextResponse.json({ error: "No password set on this account" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
        await recordAttempt(throttleKey, CHANGE_MAX_FAILURES, CHANGE_WINDOW_MS);
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            password: hashed,
            // Invalidates every issued token, including this request's own
            // session -- changing a password is expected to remove access
            // from anywhere else it is already signed in.
            passwordChangedAt: new Date(),
        },
    });
    await clearAttempts(throttleKey);

    return NextResponse.json({ ok: true, reauthRequired: true });
}
