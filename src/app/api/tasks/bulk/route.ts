import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getBoardAccess, canWrite } from "@/lib/board-access";

const bulkSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("delete"),
        taskIds: z.array(z.string()).min(1).max(100),
        boardId: z.string().min(1),
    }),
    z.object({
        action: z.literal("move"),
        taskIds: z.array(z.string()).min(1).max(100),
        boardId: z.string().min(1),
        targetColumnId: z.string().min(1),
    }),
    z.object({
        action: z.literal("reprioritize"),
        taskIds: z.array(z.string()).min(1).max(100),
        boardId: z.string().min(1),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    }),
]);

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = bulkSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { action, taskIds, boardId } = parsed.data;

        const access = await getBoardAccess(boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Verify all tasks belong to this board
        const tasks = await prisma.task.findMany({
            where: { id: { in: taskIds } },
            include: { column: { select: { boardId: true } } },
        });
        const allOnBoard = tasks.every((t) => t.column.boardId === boardId);
        if (!allOnBoard || tasks.length !== taskIds.length) {
            return NextResponse.json({ error: "One or more tasks not found" }, { status: 404 });
        }

        if (action === "delete") {
            await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
            return NextResponse.json({ success: true, affected: taskIds.length });
        }

        if (action === "reprioritize") {
            await prisma.task.updateMany({
                where: { id: { in: taskIds } },
                data: { priority: parsed.data.priority },
            });
            return NextResponse.json({ success: true, affected: taskIds.length });
        }

        if (action === "move") {
            const { targetColumnId } = parsed.data;

            const targetColumn = await prisma.column.findUnique({
                where: { id: targetColumnId },
                select: { boardId: true },
            });
            if (!targetColumn || targetColumn.boardId !== boardId) {
                return NextResponse.json({ error: "Target column not found" }, { status: 404 });
            }

            const maxOrder = await prisma.task.findFirst({
                where: { columnId: targetColumnId, id: { notIn: taskIds } },
                orderBy: { order: "desc" },
                select: { order: true },
            });

            let nextOrder = (maxOrder?.order ?? -1) + 1;
            await prisma.$transaction(
                taskIds.map((id, i) =>
                    prisma.task.update({
                        where: { id },
                        data: { columnId: targetColumnId, order: nextOrder + i },
                    })
                )
            );

            return NextResponse.json({ success: true, affected: taskIds.length });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("Bulk task error:", error);
        return NextResponse.json({ error: "Failed to apply bulk action" }, { status: 500 });
    }
}
