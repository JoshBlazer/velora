import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { BoardClient } from "./BoardClient";
import { BoardWithColumns } from "@/lib/types";

interface BoardPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
    const { id } = await params;
    const board = await prisma.board.findUnique({ where: { id }, select: { title: true } });
    return board
        ? { title: board.title, description: `Kanban board: ${board.title}` }
        : { title: "Board" };
}

export default async function BoardPage({ params }: BoardPageProps) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }
    const userId = session.user!.id!;

    const { id } = await params;

    const board = await prisma.board.findUnique({
        where: { id },
        include: {
            user: true,
            labels: true,
            columns: {
                orderBy: { order: "asc" },
                include: {
                    tasks: {
                        orderBy: { order: "asc" },
                        include: {
                            labels: true,
                            assignee: { select: { id: true, name: true, image: true } },
                            _count: { select: { comments: true } },
                        },
                    },
                },
            },
            members: {
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
            },
        },
    });

    const isOwner = board?.userId === userId;
    const isMember = (board?.members.some((m) => m.userId === userId)) ?? false;

    if (!board || (!isOwner && !isMember)) {
        notFound();
    }

    const serializedBoard: BoardWithColumns = {
        ...board,
        labels: board.labels,
        user: board.user ? { ...board.user } : undefined,
        members: board.members.map((m) => ({
            id: m.id,
            boardId: m.boardId,
            userId: m.userId,
            role: m.role,
            createdAt: m.createdAt,
            user: m.user,
        })),
        columns: board.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((task) => ({
                ...task,
                labels: task.labels,
                assignee: task.assignee ?? null,
                commentCount: task._count.comments,
            })),
        })),
    };

    return <BoardClient initialBoard={serializedBoard} isOwner={isOwner} currentUserId={userId} />;
}
