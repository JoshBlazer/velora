import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getBoardAccess, canWrite } from "@/lib/board-access";

const bodySchema = z.object({
    labelId: z.string().min(1, "Label ID is required"),
});

async function getTaskBoardId(taskId: string): Promise<string | null> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { column: { select: { boardId: true } } },
    });
    return task?.column.boardId ?? null;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: taskId } = await params;
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const boardId = await getTaskBoardId(taskId);
        if (!boardId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const { labelId } = parsed.data;
        const label = await prisma.label.findUnique({
            where: { id: labelId },
            select: { boardId: true },
        });
        if (!label || label.boardId !== boardId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.task.update({
            where: { id: taskId },
            data: { labels: { connect: { id: labelId } } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error assigning label:", error);
        return NextResponse.json({ error: "Failed to assign label" }, { status: 500 });
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

        const { id: taskId } = await params;
        const labelId = new URL(request.url).searchParams.get("labelId");
        if (!labelId) {
            return NextResponse.json({ error: "Label ID is required" }, { status: 400 });
        }

        const boardId = await getTaskBoardId(taskId);
        if (!boardId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.task.update({
            where: { id: taskId },
            data: { labels: { disconnect: { id: labelId } } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing label:", error);
        return NextResponse.json({ error: "Failed to remove label" }, { status: 500 });
    }
}
