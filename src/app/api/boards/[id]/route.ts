import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    background: z.string().min(1).optional(),
}).refine((d) => d.title !== undefined || d.background !== undefined, {
    message: "At least one field is required",
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const board = await prisma.board.findUnique({
            where: { id },
            include: {
                user: true,
                columns: {
                    orderBy: { order: "asc" },
                    include: {
                        tasks: { orderBy: { order: "asc" } },
                    },
                },
            },
        });

        if (!board || board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(board);
    } catch (error) {
        console.error("Error fetching board:", error);
        return NextResponse.json({ error: "Failed to fetch board" }, { status: 500 });
    }
}

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

        const board = await prisma.board.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!board || board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const { title, background } = parsed.data;
        const updated = await prisma.board.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(background !== undefined && { background }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating board:", error);
        return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
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

        const board = await prisma.board.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!board || board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.board.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting board:", error);
        return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
    }
}
