import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
    boardId: z.string().min(1, "Board ID is required"),
    name: z.string().min(1, "Name is required").max(30),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const boardId = new URL(request.url).searchParams.get("boardId");
        if (!boardId) {
            return NextResponse.json({ error: "Board ID is required" }, { status: 400 });
        }

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { userId: true },
        });

        if (!board || board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const labels = await prisma.label.findMany({ where: { boardId } });

        return NextResponse.json(labels);
    } catch (error) {
        console.error("Error fetching labels:", error);
        return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { boardId, name, color } = parsed.data;

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { userId: true },
        });

        if (!board || board.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const label = await prisma.label.create({
            data: { name, color, boardId },
        });

        return NextResponse.json(label, { status: 201 });
    } catch (error) {
        console.error("Error creating label:", error);
        return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
    }
}
