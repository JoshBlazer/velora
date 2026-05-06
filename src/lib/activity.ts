import prisma from "./prisma";
import { ActivityType, Prisma } from "@prisma/client";

export async function logActivity(
    boardId: string,
    userId: string,
    type: ActivityType,
    meta: Record<string, string> = {}
) {
    try {
        await prisma.activity.create({
            data: { boardId, userId, type, meta: meta as Prisma.InputJsonValue },
        });
    } catch (err) {
        console.error("[activity] failed to log:", err);
    }
}
