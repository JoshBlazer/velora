"use client";

import { useEffect, useRef } from "react";

export function useBoardSync(boardId: string, onRefresh: () => void) {
    const onRefreshRef = useRef(onRefresh);

    // Keep the ref current without writing to it during render, so the
    // connection effect below can stay keyed on boardId alone and not tear
    // down the EventSource every time the callback identity changes.
    useEffect(() => {
        onRefreshRef.current = onRefresh;
    }, [onRefresh]);

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
