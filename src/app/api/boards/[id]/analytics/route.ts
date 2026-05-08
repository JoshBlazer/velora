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

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const now = new Date();

        const [columns, recentActivities, memberCount] = await Promise.all([
            prisma.column.findMany({
                where: { boardId },
                orderBy: { order: "asc" },
                include: {
                    tasks: {
                        select: { priority: true, dueDate: true, createdAt: true },
                    },
                },
            }),
            prisma.activity.findMany({
                where: { boardId, createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" },
            }),
            prisma.boardMember.count({ where: { boardId } }),
        ]);

        const allTasks = columns.flatMap((c) => c.tasks);
        const totalTasks = allTasks.length;
        const overdueTasks = allTasks.filter(
            (t) => t.dueDate && t.dueDate < now
        ).length;

        const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        for (const t of allTasks) byPriority[t.priority]++;

        const byColumn = columns.map((c) => ({ title: c.title, count: c.tasks.length }));

        const doneColumn = columns.find((c) =>
            c.title.toLowerCase().includes("done") || c.title.toLowerCase().includes("complete")
        );
        const completedTasks = doneColumn?.tasks.length ?? 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Build 7-day activity buckets
        const buckets: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            buckets[d.toISOString().slice(0, 10)] = 0;
        }
        for (const a of recentActivities) {
            const key = new Date(a.createdAt).toISOString().slice(0, 10);
            if (key in buckets) buckets[key]++;
        }
        const activityLast7Days = Object.entries(buckets).map(([date, count]) => ({ date, count }));

        return NextResponse.json({
            totalTasks,
            overdueTasks,
            completedTasks,
            completionRate,
            memberCount,
            byPriority,
            byColumn,
            activityLast7Days,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
