import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getBoardAccess } from "@/lib/board-access";
import { logActivity } from "@/lib/activity";
import { sendBoardInviteEmail } from "@/lib/email";

const inviteSchema = z.object({
    email: z.string().email("Invalid email"),
    role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

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
        if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const members = await prisma.boardMember.findMany({
            where: { boardId },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }
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

        const { id: boardId } = await params;
        const access = await getBoardAccess(boardId, session.user.id);
        if (access !== "owner") {
            return NextResponse.json({ error: "Only board owners can invite members" }, { status: 403 });
        }

        const parsed = inviteSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { email, role } = parsed.data;

        if (email === session.user.email) {
            return NextResponse.json({ error: "You're already the board owner" }, { status: 400 });
        }

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { title: true },
        });
        if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const identifier = `invite:${boardId}:${email}:${role}`;
        await prisma.verificationToken.deleteMany({ where: { identifier } });

        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await prisma.verificationToken.create({ data: { identifier, token, expires } });

        sendBoardInviteEmail(email, session.user.name ?? null, board.title, token).catch((err) =>
            console.error("[invite] email failed:", err)
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error inviting member:", error);
        return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
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

        const { id: boardId } = await params;
        const access = await getBoardAccess(boardId, session.user.id);
        if (access !== "owner") {
            return NextResponse.json({ error: "Only board owners can remove members" }, { status: 403 });
        }

        const memberId = new URL(request.url).searchParams.get("memberId");
        if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });

        const member = await prisma.boardMember.findUnique({
            where: { id: memberId },
            include: { user: { select: { name: true, email: true } } },
        });
        if (!member || member.boardId !== boardId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (member.role === "OWNER") {
            return NextResponse.json({ error: "Cannot remove the board owner" }, { status: 400 });
        }

        await prisma.boardMember.delete({ where: { id: memberId } });
        await logActivity(boardId, session.user.id, "MEMBER_REMOVED", { email: member.user.email });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }
}
