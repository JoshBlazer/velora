import { NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getBoardAccess, canRead } from "@/lib/board-access";

export const runtime = "nodejs";

// How often each connected viewer polls for new activity, and how long a
// single stream is allowed to stay open before the client reconnects. Both
// are tunable because the right trade-off between responsiveness and database
// load depends on how many people sit on a board at once.
const STREAM_POLL_MS = Number(process.env.STREAM_POLL_MS ?? 3_000);
const STREAM_MAX_LIFETIME_MS = Number(process.env.STREAM_MAX_LIFETIME_MS ?? 5 * 60 * 1000);

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
    let maxLifetime: ReturnType<typeof setTimeout>;

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(": connected\n\n"));

            // Every open board costs one query per tick, per viewer, for as
            // long as the tab stays open -- at the default 3s that is 20 a
            // minute each. Closing the stream periodically caps how long a
            // single serverless invocation can run; the client's EventSource
            // reconnects on its own.
            maxLifetime = setTimeout(() => {
                clearInterval(timer);
                controller.close();
            }, STREAM_MAX_LIFETIME_MS);

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
                    clearTimeout(maxLifetime);
                    controller.close();
                }
            }, STREAM_POLL_MS);
        },
        cancel() {
            clearInterval(timer);
            clearTimeout(maxLifetime);
        },
    });

    request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        clearTimeout(maxLifetime);
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            Connection: "keep-alive",
        },
    });
}
