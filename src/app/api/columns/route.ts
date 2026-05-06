import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getBoardAccess, canWrite } from "@/lib/board-access";
import { logActivity } from "@/lib/activity";

const createSchema = z.object({
    boardId: z.string().min(1, "Board ID is required"),
    title: z.string().min(1, "Title is required"),
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

        const { boardId, title } = parsed.data;

        const access = await getBoardAccess(boardId, session.user.id);
        if (!canWrite(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const maxOrder = await prisma.column.aggregate({
            where: { boardId },
            _max: { order: true },
        });

        const column = await prisma.column.create({
            data: {
                title,
                order: (maxOrder._max.order ?? -1) + 1,
                boardId,
            },
            include: { tasks: true },
        });

        await logActivity(boardId, session.user.id, "COLUMN_CREATED", { title });

        return NextResponse.json(column, { status: 201 });
    } catch (error) {
        console.error("Error creating column:", error);
        return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
    }
}
