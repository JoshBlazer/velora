import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { commentId } = await params;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true },
        });

        if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (comment.userId !== session.user.id) {
            return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 });
        }

        await prisma.comment.delete({ where: { id: commentId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
