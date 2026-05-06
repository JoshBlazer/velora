"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ActivityType } from "@prisma/client";

interface ActivityEntry {
    id: string;
    type: ActivityType;
    meta: Record<string, string>;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
}

interface ActivityPanelProps {
    boardId: string;
    isOpen: boolean;
    onClose: () => void;
}

function formatActivityType(type: ActivityType, meta: Record<string, string>): string {
    switch (type) {
        case "TASK_CREATED": return `created task "${meta.content ?? ""}"`;
        case "TASK_UPDATED": return `updated task "${meta.content ?? ""}"`;
        case "TASK_DELETED": return `deleted task "${meta.content ?? ""}"`;
        case "TASK_MOVED":   return `moved task "${meta.content ?? ""}"`;
        case "COLUMN_CREATED": return `added column "${meta.title ?? ""}"`;
        case "COLUMN_DELETED": return `removed column "${meta.title ?? ""}"`;
        case "COLUMN_RENAMED": return `renamed column to "${meta.title ?? ""}"`;
        case "BOARD_RENAMED": return `renamed board to "${meta.title ?? ""}"`;
        case "MEMBER_ADDED":   return `joined the board`;
        case "MEMBER_REMOVED": return `removed ${meta.email ?? "a member"}`;
        default: return "did something";
    }
}

function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export function ActivityPanel({ boardId, isOpen, onClose }: ActivityPanelProps) {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        fetch(`/api/boards/${boardId}/activity`)
            .then((r) => r.json())
            .then((data) => setActivities(Array.isArray(data) ? data : []))
            .catch(() => setActivities([]))
            .finally(() => setIsLoading(false));
    }, [isOpen, boardId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, x: 320 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 320 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-80 p-4"
                    >
                        <GlassPanel intensity="heavy" className="flex h-full flex-col p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-velora-cyan" />
                                    <span className="font-semibold text-white">Activity</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded p-1 text-velora-text-subtle hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3">
                                {isLoading && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-velora-cyan border-t-transparent" />
                                    </div>
                                )}

                                {!isLoading && activities.length === 0 && (
                                    <p className="py-8 text-center text-sm text-velora-text-subtle">
                                        No activity yet
                                    </p>
                                )}

                                {activities.map((entry) => {
                                    const initials = (entry.user.name ?? entry.user.id)[0].toUpperCase();
                                    return (
                                        <div key={entry.id} className="flex gap-3">
                                            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan/40 to-velora-pink/40 text-xs font-semibold text-white">
                                                {entry.user.image ? (
                                                    <img
                                                        src={entry.user.image}
                                                        alt={entry.user.name ?? ""}
                                                        className="h-7 w-7 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    initials
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white">
                                                    <span className="font-medium">{entry.user.name ?? "Someone"}</span>{" "}
                                                    <span className="text-velora-text-muted">
                                                        {formatActivityType(entry.type, entry.meta as Record<string, string>)}
                                                    </span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-velora-text-subtle">
                                                    {timeAgo(entry.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassPanel>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
