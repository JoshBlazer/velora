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
                        include: { labels: true },
                    },
                },
            },
        },
    });

    if (!board || board.userId !== session.user.id) {
        notFound();
    }

    const serializedBoard: BoardWithColumns = {
        ...board,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        labels: board.labels,
        user: board.user ? { ...board.user } : undefined,
        columns: board.columns.map((column) => ({
            ...column,
            createdAt: column.createdAt,
            updatedAt: column.updatedAt,
            tasks: column.tasks.map((task) => ({
                ...task,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                labels: task.labels,
            })),
        })),
    };

    return <BoardClient initialBoard={serializedBoard} />;
}
