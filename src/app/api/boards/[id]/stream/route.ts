import { NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getBoardAccess, canRead } from "@/lib/board-access";

export const runtime = "nodejs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id: boardId } = await params;
    const access = await getBoardAccess(boardId, session.user.id);
    if (!canRead(access)) {
        return new Response("Not found", { status: 404 });
    }

    const encoder = new TextEncoder();
    let lastChecked = new Date();
    let timer: ReturnType<typeof setInterval>;

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(": connected\n\n"));

            timer = setInterval(async () => {
                try {
                    const snapshot = new Date();
                    const hasNew = await prisma.activity.findFirst({
                        where: { boardId, createdAt: { gt: lastChecked } },
                        select: { id: true },
                    });
                    lastChecked = snapshot;

                    if (hasNew) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: "refresh" })}\n\n`)
                        );
                    } else {
                        controller.enqueue(encoder.encode(": ping\n\n"));
                    }
                } catch {
                    clearInterval(timer);
                    controller.close();
                }
            }, 3000);
        },
        cancel() {
            clearInterval(timer);
        },
    });

    request.signal.addEventListener("abort", () => clearInterval(timer));

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            Connection: "keep-alive",
        },
    });
}
