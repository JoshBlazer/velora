import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { BoardRole } from "@prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const record = await prisma.verificationToken.findUnique({ where: { token } });
        if (!record || !record.identifier.startsWith("invite:")) {
            return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });
        }
        if (record.expires < new Date()) {
            await prisma.verificationToken.delete({ where: { token } });
            return NextResponse.json({ error: "This invite link has expired" }, { status: 400 });
        }

        const [, boardId, , role] = record.identifier.split(":");
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { id: true, title: true, user: { select: { name: true } } },
        });

        if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

        return NextResponse.json({
            boardId: board.id,
            boardTitle: board.title,
            ownerName: board.user.name,
            role,
        });
    } catch (error) {
        console.error("Error fetching invite:", error);
        return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await params;

        const record = await prisma.verificationToken.findUnique({ where: { token } });
        if (!record || !record.identifier.startsWith("invite:")) {
            return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });
        }
        if (record.expires < new Date()) {
            await prisma.verificationToken.delete({ where: { token } });
            return NextResponse.json({ error: "This invite link has expired" }, { status: 400 });
        }

        const [, boardId, invitedEmail, role] = record.identifier.split(":");

        // Addresses are stored as typed, so "Sam@Example.com" and
        // "sam@example.com" are the same mailbox and either spelling should
        // be able to accept the invite.
        if (session.user.email?.toLowerCase() !== invitedEmail?.toLowerCase()) {
            return NextResponse.json(
                { error: `This invite was sent to ${invitedEmail}. Please sign in with that email.` },
                { status: 403 }
            );
        }

        // The role is read back out of the token. Only the invite endpoint
        // writes these and it restricts the role to EDITOR or VIEWER, but
        // nothing re-checked that here, so any future path able to shape an
        // identifier would have handed out whatever role it named -- OWNER
        // included. Verify rather than trust.
        if (role !== "EDITOR" && role !== "VIEWER") {
            console.error(`[invite] Refusing unexpected role in token: ${role}`);
            return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
        }

        const existing = await prisma.boardMember.findUnique({
            where: { boardId_userId: { boardId, userId: session.user.id } },
        });

        if (!existing) {
            await prisma.boardMember.create({
                data: { boardId, userId: session.user.id, role: role as BoardRole },
            });
            await logActivity(boardId, session.user.id, "MEMBER_ADDED", {
                email: session.user.email,
                role,
            });
        }

        await prisma.verificationToken.delete({ where: { token } });

        return NextResponse.json({ boardId });
    } catch (error) {
        console.error("Error accepting invite:", error);
        return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
    }
}
