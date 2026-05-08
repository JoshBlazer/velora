import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getBoardAccess, canRead, canWrite } from "@/lib/board-access";
import { logActivity } from "@/lib/activity";

const createSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(2000),
});

async function getTaskBoardId(taskId: string): Promise<string | null> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { column: { select: { boardId: true } }, content: true },
    });
    return task?.column.boardId ?? null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: taskId } = await params;
        const boardId = await getTaskBoardId(taskId);
        if (!boardId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(boardId, session.user.id);
        if (!canRead(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const comments = await prisma.comment.findMany({
            where: { taskId },
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, name: true, image: true } } },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
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

        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const boardId = await getTaskBoardId(taskId);
        if (!boardId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const comment = await prisma.comment.create({
            data: { content: parsed.data.content, taskId, userId: session.user.id },
            include: { user: { select: { id: true, name: true, image: true } } },
        });

        await logActivity(boardId, session.user.id, "COMMENT_ADDED", { taskId });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
