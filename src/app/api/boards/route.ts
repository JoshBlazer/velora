import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
    title: z.string().min(1, "Title is required"),
});

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

        const board = await prisma.board.create({
            data: {
                title: parsed.data.title,
                userId: session.user.id,
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                columns: {
                    create: [
                        { title: "To Do", order: 0 },
                        { title: "In Progress", order: 1 },
                        { title: "Done", order: 2 },
                    ],
                },
            },
            include: { columns: true },
        });

        return NextResponse.json(board, { status: 201 });
    } catch (error) {
        console.error("Error creating board:", error);
        return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
    }
}
