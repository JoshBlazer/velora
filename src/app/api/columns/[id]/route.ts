import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    title: z.string().min(1, "Title is required"),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const parsed = updateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const column = await prisma.column.findUnique({
            where: { id },
            include: { board: { select: { userId: true } } },
        });

        if (!column || column.board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updated = await prisma.column.update({
            where: { id },
            data: { title: parsed.data.title },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating column:", error);
        return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const column = await prisma.column.findUnique({
            where: { id },
            include: { board: { select: { userId: true } } },
        });

        if (!column || column.board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.column.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting column:", error);
        return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
    }
}
