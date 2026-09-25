import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    image: z.string().url("Must be a valid URL").max(500).nullable().optional(),
});

const deleteSchema = z.object({
    password: z.string().min(1, "Password is required"),
});

export async function PATCH(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data,
        select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json(user);
}

export async function DELETE(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
    });
    if (!user) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Deleting an account is irreversible and takes every board it owns with
    // it, including boards shared with other people. A session alone was
    // enough to trigger that, so anyone who got hold of one could destroy the
    // account outright. Re-authenticate first.
    if (user.password) {
        const parsed = deleteSchema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Your password is required to delete your account" },
                { status: 400 }
            );
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) {
            return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
        }
    }

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ ok: true });
}
