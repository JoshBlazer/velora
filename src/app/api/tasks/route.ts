import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Priority } from "@prisma/client";
import { getBoardAccess, canWrite } from "@/lib/board-access";
import { logActivity } from "@/lib/activity";

const createSchema = z.object({
    content: z.string().min(1, "Content is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    columnId: z.string().min(1, "Column ID is required"),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
});

const updateSchema = z.object({
    id: z.string().min(1, "Task ID is required"),
    content: z.string().min(1).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { content, priority, columnId, dueDate } = parsed.data;

        const column = await prisma.column.findUnique({
            where: { id: columnId },
            select: { boardId: true },
        });
        if (!column) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(column.boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const maxOrderTask = await prisma.task.findFirst({
            where: { columnId },
            orderBy: { order: "desc" },
            select: { order: true },
        });

        const task = await prisma.task.create({
            data: {
                content,
                priority: priority as Priority,
                order: maxOrderTask ? maxOrderTask.order + 1 : 0,
                columnId,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
            include: { labels: true },
        });

        await logActivity(column.boardId, session.user.id, "TASK_CREATED", { content });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = updateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { id, content, priority, dueDate } = parsed.data;

        const task = await prisma.task.findUnique({
            where: { id },
            include: { column: { select: { boardId: true } } },
        });
        if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(task.column.boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updateData: { content?: string; priority?: Priority; dueDate?: Date | null } = {};
        if (content !== undefined) updateData.content = content;
        if (priority !== undefined) updateData.priority = priority as Priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        const updated = await prisma.task.update({ where: { id }, data: updateData, include: { labels: true } });

        await logActivity(task.column.boardId, session.user.id, "TASK_UPDATED", { content: content ?? task.content });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = new URL(request.url).searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        const task = await prisma.task.findUnique({
            where: { id },
            include: { column: { select: { boardId: true } } },
        });
        if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const access = await getBoardAccess(task.column.boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.task.delete({ where: { id } });
        await logActivity(task.column.boardId, session.user.id, "TASK_DELETED", { content: task.content });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
