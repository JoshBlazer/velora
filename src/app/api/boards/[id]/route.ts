import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getBoardAccess, canRead, canWrite } from "@/lib/board-access";
import { logActivity } from "@/lib/activity";

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
        const access = await getBoardAccess(id, session.user.id);
        if (!canRead(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const board = await prisma.board.findUnique({
            where: { id },
            include: {
                user: true,
                labels: true,
                columns: {
                    orderBy: { order: "asc" },
                    include: {
                        tasks: {
                            orderBy: { order: "asc" },
                            include: {
                                labels: true,
                                assignee: { select: { id: true, name: true, image: true } },
                                _count: { select: { comments: true } },
                            },
                        },
                    },
                },
                members: {
                    include: { user: { select: { id: true, name: true, email: true, image: true } } },
                },
            },
        });

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
        const access = await getBoardAccess(id, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const parsed = updateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { title, background } = parsed.data;
        const updated = await prisma.board.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(background !== undefined && { background }),
            },
        });

        if (title !== undefined) {
            await logActivity(id, session.user.id, "BOARD_RENAMED", { title });
        }

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
        const access = await getBoardAccess(id, session.user.id);
        if (access !== "owner") {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.board.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting board:", error);
        return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
    }
}
