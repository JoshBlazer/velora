"use client";

import { useEffect, useRef } from "react";

export function useBoardSync(boardId: string, onRefresh: () => void) {
    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;

    useEffect(() => {
        let es: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let active = true;

        const connect = () => {
            if (!active) return;
            es = new EventSource(`/api/boards/${boardId}/stream`);

            es.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === "refresh") onRefreshRef.current();
                } catch {
                    // ignore malformed events
                }
            };

            es.onerror = () => {
                es?.close();
                es = null;
                if (active) {
                    reconnectTimer = setTimeout(connect, 5000);
                }
            };
        };

        connect();

        return () => {
            active = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            es?.close();
        };
    }, [boardId]);
}
