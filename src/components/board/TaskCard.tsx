"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Task, Label, priorityColors } from "@/lib/types";
import { GripVertical, Trash2, MessageSquare } from "lucide-react";
import { formatDueDate, isOverdue } from "@/lib/date-utils";
import { Calendar } from "lucide-react";

interface TaskCardProps {
    task: Task;
    boardLabels: Label[];
    isSelected?: boolean;
    bulkMode?: boolean;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDelete: (taskId: string) => void;
    onOpenDetail: (taskId: string) => void;
    onToggleSelect?: (taskId: string) => void;
}

function Avatar({ user }: { user: { name: string | null; image: string | null } | null | undefined }) {
    if (!user) return null;
    return user.image ? (
        <img src={user.image} alt={user.name ?? ""} className="h-5 w-5 rounded-full object-cover" />
    ) : (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan/40 to-velora-pink/40 text-[10px] font-semibold text-white">
            {(user.name ?? "?")[0].toUpperCase()}
        </div>
    );
}

export function TaskCard({
    task,
    isSelected,
    bulkMode,
    onDragStart,
    onDelete,
    onOpenDetail,
    onToggleSelect,
}: TaskCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const colors = priorityColors[task.priority];
    const taskLabels = task.labels ?? [];
    const dueDateStr = formatDueDate(task.dueDate);
    const overdue = isOverdue(task.dueDate);

    if (isDeleting) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassPanel intensity="medium" className="p-4">
                    <p className="mb-4 text-sm text-white">Delete this task?</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsDeleting(false)}
                            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-velora-text-muted transition-colors hover:bg-white/20"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onDelete(task.id); setIsDeleting(false); }}
                            className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/30"
                        >
                            Delete
                        </button>
                    </div>
                </GlassPanel>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            draggable={!bulkMode}
            onDragStart={(e) => !bulkMode && onDragStart(e as unknown as React.DragEvent, task.id)}
            className={`group ${bulkMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
            aria-label={task.content}
            onClick={bulkMode ? () => onToggleSelect?.(task.id) : undefined}
        >
            <GlassPanel
                intensity="light"
                hoverable
                className={`relative p-3 transition-all ${isSelected ? "ring-2 ring-velora-cyan" : ""}`}
            >
                {/* Bulk checkbox */}
                {bulkMode && (
                    <div className={`absolute left-2 top-2 h-4 w-4 rounded border transition-all ${isSelected ? "border-velora-cyan bg-velora-cyan" : "border-white/30 bg-white/5"}`}>
                        {isSelected && (
                            <svg viewBox="0 0 12 12" className="h-full w-full p-0.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="1,6 4,9 11,2" />
                            </svg>
                        )}
                    </div>
                )}

                {/* Delete button */}
                {!bulkMode && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                        aria-label={`Delete task: ${task.content}`}
                        className="absolute right-2 top-2 rounded p-1 text-velora-text-subtle opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                )}

                <div className={`mb-2 flex items-center justify-between ${bulkMode ? "pl-6" : ""}`}>
                    <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                        aria-label={`Priority: ${task.priority}`}
                    >
                        {task.priority}
                    </span>
                    {!bulkMode && (
                        <GripVertical className="h-4 w-4 text-velora-text-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    )}
                </div>

                <p
                    onClick={!bulkMode ? () => onOpenDetail(task.id) : undefined}
                    role={!bulkMode ? "button" : undefined}
                    tabIndex={!bulkMode ? 0 : undefined}
                    onKeyDown={!bulkMode ? (e) => e.key === "Enter" && onOpenDetail(task.id) : undefined}
                    aria-label={`Open task: ${task.content}`}
                    className={`text-sm leading-relaxed text-white ${!bulkMode ? "cursor-pointer hover:text-velora-text-muted transition-colors" : ""}`}
                >
                    {task.content}
                </p>

                {/* Labels */}
                {taskLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1" aria-label="Labels">
                        {taskLabels.map((label) => (
                            <span
                                key={label.id}
                                className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs"
                                style={{ background: `${label.color}22`, color: label.color }}
                            >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: label.color }} aria-hidden="true" />
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer: due date + assignee + comment count */}
                <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {dueDateStr && (
                            <div
                                className={`flex items-center gap-1 text-xs ${overdue ? "text-red-400" : "text-velora-text-subtle"}`}
                                aria-label={`Due ${dueDateStr}${overdue ? " — overdue" : ""}`}
                            >
                                <Calendar className="h-3 w-3" aria-hidden="true" />
                                {dueDateStr}
                            </div>
                        )}
                        {(task.commentCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-velora-text-subtle">
                                <MessageSquare className="h-3 w-3" />
                                {task.commentCount}
                            </div>
                        )}
                    </div>
                    {task.assignee && (
                        <div title={task.assignee.name ?? undefined}>
                            <Avatar user={task.assignee} />
                        </div>
                    )}
                </div>
            </GlassPanel>
        </motion.div>
    );
}

export default TaskCard;
