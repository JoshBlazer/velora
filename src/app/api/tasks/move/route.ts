import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const moveSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    targetColumnId: z.string().min(1, "Target column ID is required"),
    newOrder: z.number().int().min(0, "Order must be a non-negative integer"),
});

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = moveSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { taskId, targetColumnId, newOrder } = parsed.data;

        const currentTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: { column: { include: { board: { select: { userId: true } } } } },
        });

        if (!currentTask || currentTask.column.board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const targetColumn = await prisma.column.findUnique({
            where: { id: targetColumnId },
            include: { board: { select: { userId: true } } },
        });

        if (!targetColumn || targetColumn.board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const isMovingToNewColumn = currentTask.columnId !== targetColumnId;

        await prisma.$transaction(async (tx) => {
            if (isMovingToNewColumn) {
                await tx.task.updateMany({
                    where: { columnId: currentTask.columnId, order: { gt: currentTask.order } },
                    data: { order: { decrement: 1 } },
                });

                await tx.task.updateMany({
                    where: { columnId: targetColumnId, order: { gte: newOrder } },
                    data: { order: { increment: 1 } },
                });

                await tx.task.update({
                    where: { id: taskId },
                    data: { columnId: targetColumnId, order: newOrder },
                });
            } else {
                const oldOrder = currentTask.order;

                if (newOrder > oldOrder) {
                    await tx.task.updateMany({
                        where: { columnId: targetColumnId, order: { gt: oldOrder, lte: newOrder } },
                        data: { order: { decrement: 1 } },
                    });
                } else if (newOrder < oldOrder) {
                    await tx.task.updateMany({
                        where: { columnId: targetColumnId, order: { gte: newOrder, lt: oldOrder } },
                        data: { order: { increment: 1 } },
                    });
                }

                await tx.task.update({ where: { id: taskId }, data: { order: newOrder } });
            }
        });

        const updatedTask = await prisma.task.findUnique({ where: { id: taskId } });

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("Error moving task:", error);
        return NextResponse.json({ error: "Failed to move task" }, { status: 500 });
    }
}
