import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getBoardAccess, canRead } from "@/lib/board-access";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: boardId } = await params;
        const access = await getBoardAccess(boardId, session.user.id);
        if (!canRead(access)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const activities = await prisma.activity.findMany({
            where: { boardId },
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Error fetching activity:", error);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }
}
