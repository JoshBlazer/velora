import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { InviteClient } from "./InviteClient";

export const metadata: Metadata = { title: "Board Invite" };

interface InvitePageProps {
    params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = await params;
    const session = await auth();

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record || !record.identifier.startsWith("invite:") || record.expires < new Date()) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-velora-dark p-6">
                <div className="text-center">
                    <h1 className="mb-2 text-2xl font-bold text-white">Invalid Invite</h1>
                    <p className="text-velora-text-muted">This invite link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    const [, boardId, , role] = record.identifier.split(":");
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { title: true, user: { select: { name: true } } },
    });

    if (!board) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-velora-dark p-6">
                <div className="text-center">
                    <h1 className="mb-2 text-2xl font-bold text-white">Board Not Found</h1>
                    <p className="text-velora-text-muted">The board no longer exists.</p>
                </div>
            </div>
        );
    }

    if (!session?.user?.id) {
        redirect(`/login?callbackUrl=/invite/${token}`);
    }

    return (
        <InviteClient
            token={token}
            boardTitle={board.title}
            ownerName={board.user.name}
            role={role}
            userEmail={session.user.email ?? ""}
        />
    );
}
