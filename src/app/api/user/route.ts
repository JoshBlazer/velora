import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    image: z.string().url("Must be a valid URL").max(500).nullable().optional(),
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

export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ ok: true });
}
