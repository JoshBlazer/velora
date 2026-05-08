"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, MoveRight, Flag, X } from "lucide-react";
import { Priority } from "@prisma/client";
import { ColumnWithTasks } from "@/lib/types";

interface BulkActionsBarProps {
    selectedCount: number;
    columns: ColumnWithTasks[];
    boardId: string;
    onClear: () => void;
    onBulkDelete: () => void;
    onBulkMove: (targetColumnId: string) => void;
    onBulkReprioritize: (priority: Priority) => void;
}

export function BulkActionsBar({
    selectedCount,
    columns,
    boardId,
    onClear,
    onBulkDelete,
    onBulkMove,
    onBulkReprioritize,
}: BulkActionsBarProps) {
    const [showMove, setShowMove] = useState(false);
    const [showPriority, setShowPriority] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-velora-dark/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
                <span className="text-sm font-medium text-velora-cyan">
                    {selectedCount} selected
                </span>

                <div className="h-4 w-px bg-white/20" />

                {/* Move */}
                <div className="relative">
                    <button
                        onClick={() => { setShowMove(!showMove); setShowPriority(false); setConfirmDelete(false); }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <MoveRight className="h-4 w-4" />
                        Move to
                    </button>
                    {showMove && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
                            <div className="absolute bottom-10 left-0 z-20 min-w-[160px] rounded-xl border border-white/10 bg-velora-dark/95 py-1 shadow-xl backdrop-blur-xl">
                                {columns.map((col) => (
                                    <button
                                        key={col.id}
                                        onClick={() => { onBulkMove(col.id); setShowMove(false); }}
                                        className="flex w-full items-center px-3 py-2 text-sm text-velora-text-muted hover:bg-white/10 hover:text-white"
                                    >
                                        {col.title}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Priority */}
                <div className="relative">
                    <button
                        onClick={() => { setShowPriority(!showPriority); setShowMove(false); setConfirmDelete(false); }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <Flag className="h-4 w-4" />
                        Priority
                    </button>
                    {showPriority && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPriority(false)} />
                            <div className="absolute bottom-10 left-0 z-20 rounded-xl border border-white/10 bg-velora-dark/95 py-1 shadow-xl backdrop-blur-xl">
                                {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => { onBulkReprioritize(p); setShowPriority(false); }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-velora-text-muted hover:bg-white/10 hover:text-white"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="h-4 w-px bg-white/20" />

                {/* Delete */}
                {confirmDelete ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400">Delete {selectedCount}?</span>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="rounded px-2 py-1 text-xs text-velora-text-muted hover:bg-white/10"
                        >
                            No
                        </button>
                        <button
                            onClick={() => { onBulkDelete(); setConfirmDelete(false); }}
                            className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                        >
                            Yes
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                )}

                <div className="h-4 w-px bg-white/20" />

                <button
                    onClick={onClear}
                    className="rounded-lg p-1.5 text-velora-text-subtle hover:bg-white/10 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
}
