import prisma from "./prisma";

export type AccessLevel = "owner" | "editor" | "viewer" | null;

export async function getBoardAccess(boardId: string, userId: string): Promise<AccessLevel> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: {
            userId: true,
            members: {
                where: { userId },
                select: { role: true },
            },
        },
    });

    if (!board) return null;
    if (board.userId === userId) return "owner";

    const member = board.members[0];
    if (!member) return null;

    switch (member.role) {
        case "OWNER": return "owner";
        case "EDITOR": return "editor";
        case "VIEWER": return "viewer";
        default: return null;
    }
}

export function canWrite(access: AccessLevel): boolean {
    return access === "owner" || access === "editor";
}

export function canRead(access: AccessLevel): boolean {
    return access !== null;
}
