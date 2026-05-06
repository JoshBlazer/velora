import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDueDateReminderEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
    const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const tasks = await prisma.task.findMany({
            where: {
                dueDate: { gte: now, lte: in24h },
                reminderSentAt: null,
            },
            include: {
                column: {
                    include: {
                        board: {
                            include: {
                                user: { select: { id: true, name: true, email: true } },
                            },
                        },
                    },
                },
            },
        });

        if (tasks.length === 0) {
            return NextResponse.json({ sent: 0 });
        }

        const byUser = new Map<string, typeof tasks>();
        for (const task of tasks) {
            const userId = task.column.board.userId;
            if (!byUser.has(userId)) byUser.set(userId, []);
            byUser.get(userId)!.push(task);
        }

        let sent = 0;
        const sentTaskIds: string[] = [];

        for (const [, userTasks] of byUser) {
            const user = userTasks[0].column.board.user;
            try {
                await sendDueDateReminderEmail(
                    user.email,
                    user.name,
                    userTasks.map((t) => ({
                        content: t.content,
                        boardTitle: t.column.board.title,
                        dueDate: t.dueDate!,
                    }))
                );
                sent++;
                sentTaskIds.push(...userTasks.map((t) => t.id));
            } catch (err) {
                console.error(`[reminders] email failed for user ${user.id}:`, err);
            }
        }

        if (sentTaskIds.length > 0) {
            await prisma.task.updateMany({
                where: { id: { in: sentTaskIds } },
                data: { reminderSentAt: now },
            });
        }

        return NextResponse.json({ sent, tasks: sentTaskIds.length });
    } catch (error) {
        console.error("Cron reminders error:", error);
        return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
    }
}
