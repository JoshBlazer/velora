import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "My Boards",
    description: "View and manage your Velora kanban boards.",
};
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Sparkles, Plus, Layers, Settings, Users } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

export default async function BoardsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const [ownedBoards, sharedMemberships] = await Promise.all([
        prisma.board.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            include: {
                columns: { include: { _count: { select: { tasks: true } } } },
            },
        }),
        prisma.boardMember.findMany({
            where: { userId: session.user.id, role: { not: "OWNER" } },
            include: {
                board: {
                    include: {
                        columns: { include: { _count: { select: { tasks: true } } } },
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const totalTasks = (columns: { _count: { tasks: number } }[]) =>
        columns.reduce((sum, col) => sum + col._count.tasks, 0);

    const sharedBoards = sharedMemberships.map((m) => ({ ...m.board, role: m.role }));

    return (
        <GlassLayout>
            <div className="min-h-screen p-6">
                {/* Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Velora</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                        >
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name ?? "avatar"}
                                    width={28}
                                    height={28}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan to-velora-pink text-xs font-semibold text-white">
                                    {(session.user.name || session.user.email || "?")[0].toUpperCase()}
                                </div>
                            )}
                            <span className="hidden sm:block">{session.user.name || session.user.email}</span>
                            <Settings className="h-4 w-4" />
                        </Link>
                        <SignOutButton />
                    </div>
                </header>

                {/* My Boards */}
                <div className="mb-10">
                    <h1 className="mb-6 text-3xl font-bold text-white">Your Boards</h1>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Link href="/boards/new">
                            <GlassPanel
                                hoverable
                                intensity="light"
                                className="flex h-48 cursor-pointer flex-col items-center justify-center gap-4 border-dashed"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan/20 to-velora-pink/20">
                                    <Plus className="h-7 w-7 text-velora-cyan" />
                                </div>
                                <span className="font-medium text-velora-text-muted">Create New Board</span>
                            </GlassPanel>
                        </Link>

                        {ownedBoards.map((board) => (
                            <Link key={board.id} href={`/board/${board.id}`}>
                                <GlassPanel hoverable intensity="medium" className="h-48 cursor-pointer p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-velora-cyan to-velora-purple">
                                            <Layers className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-white">{board.title}</h3>
                                    <p className="text-sm text-velora-text-subtle">
                                        {board.columns.length} columns • {totalTasks(board.columns)} tasks
                                    </p>
                                </GlassPanel>
                            </Link>
                        ))}
                    </div>

                    {ownedBoards.length === 0 && (
                        <p className="mt-4 text-velora-text-muted">No boards yet. Create your first one!</p>
                    )}
                </div>

                {/* Shared Boards */}
                {sharedBoards.length > 0 && (
                    <div>
                        <div className="mb-6 flex items-center gap-2">
                            <Users className="h-5 w-5 text-velora-text-muted" />
                            <h2 className="text-xl font-semibold text-white">Shared With Me</h2>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {sharedBoards.map((board) => (
                                <Link key={board.id} href={`/board/${board.id}`}>
                                    <GlassPanel hoverable intensity="medium" className="h-48 cursor-pointer p-6">
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-velora-pink to-velora-purple">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize text-velora-text-subtle">
                                                {board.role.toLowerCase()}
                                            </span>
                                        </div>
                                        <h3 className="mb-1 text-lg font-semibold text-white">{board.title}</h3>
                                        <p className="text-xs text-velora-text-subtle">
                                            by {board.user.name ?? "Unknown"}
                                        </p>
                                        <p className="mt-1 text-sm text-velora-text-subtle">
                                            {board.columns.length} columns • {totalTasks(board.columns)} tasks
                                        </p>
                                    </GlassPanel>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </GlassLayout>
    );
}
