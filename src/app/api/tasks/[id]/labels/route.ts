import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
    labelId: z.string().min(1, "Label ID is required"),
});

async function verifyTaskOwnership(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { column: { include: { board: { select: { userId: true } } } } },
    });
    return task && task.column.board.userId === userId ? task : null;
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

        const task = await verifyTaskOwnership(taskId, session.user.id);
        if (!task) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const { labelId } = parsed.data;

        const label = await prisma.label.findUnique({
            where: { id: labelId },
            select: { boardId: true, board: { select: { userId: true } } },
        });

        if (!label || label.board.userId !== session.user.id) {
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

        const task = await verifyTaskOwnership(taskId, session.user.id);
        if (!task) {
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
