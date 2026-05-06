"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Task, Label, priorityColors } from "@/lib/types";
import { GripVertical, Trash2, X, Check, Calendar } from "lucide-react";
import { Priority } from "@prisma/client";

interface TaskCardProps {
    task: Task;
    boardLabels: Label[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onUpdate: (taskId: string, content: string, priority: Priority, dueDate: Date | null) => void;
    onDelete: (taskId: string) => void;
    onToggleLabel: (taskId: string, labelId: string, assigned: boolean) => void;
}

function formatDueDate(date: Date | null | string): string | null {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(date: Date | null | string): boolean {
    if (!date) return false;
    const d = typeof date === "string" ? new Date(date) : date;
    return d < new Date();
}

function toDateInputValue(date: Date | null | string): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
}

export function TaskCard({ task, boardLabels, onDragStart, onUpdate, onDelete, onToggleLabel }: TaskCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const [editPriority, setEditPriority] = useState<Priority>(task.priority);
    const [editDueDate, setEditDueDate] = useState(toDateInputValue(task.dueDate));

    const colors = priorityColors[task.priority];
    const assignedLabelIds = new Set((task.labels ?? []).map((l) => l.id));

    const handleSave = () => {
        if (!editContent.trim()) return;
        const dueDate = editDueDate ? new Date(editDueDate) : null;
        onUpdate(task.id, editContent.trim(), editPriority, dueDate);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditContent(task.content);
        setEditPriority(task.priority);
        setEditDueDate(toDateInputValue(task.dueDate));
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") handleCancel();
        else if (e.key === "Enter" && e.metaKey) handleSave();
    };

    if (isDeleting) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
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

    if (isEditing) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassPanel intensity="medium" className="p-3">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        rows={2}
                        className="mb-3 w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                    />

                    {/* Priority */}
                    <div className="mb-3 flex gap-2">
                        {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setEditPriority(p)}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${editPriority === p
                                    ? p === "LOW"
                                        ? "bg-velora-cyan/20 text-velora-cyan ring-1 ring-velora-cyan/30"
                                        : p === "MEDIUM"
                                            ? "bg-velora-pink/20 text-velora-pink ring-1 ring-velora-pink/30"
                                            : "bg-velora-purple/20 text-velora-purple ring-1 ring-velora-purple/30"
                                    : "bg-white/5 text-velora-text-subtle hover:bg-white/10"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Due Date */}
                    <div className="mb-3">
                        <label className="mb-1 block text-xs text-velora-text-subtle">Due date</label>
                        <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="w-full rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50 [color-scheme:dark]"
                        />
                    </div>

                    {/* Labels */}
                    {boardLabels.length > 0 && (
                        <div className="mb-3">
                            <p className="mb-1.5 text-xs text-velora-text-subtle">Labels</p>
                            <div className="flex flex-wrap gap-1.5">
                                {boardLabels.map((label) => {
                                    const isAssigned = assignedLabelIds.has(label.id);
                                    return (
                                        <button
                                            key={label.id}
                                            type="button"
                                            onClick={() => onToggleLabel(task.id, label.id, !isAssigned)}
                                            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-all ${isAssigned
                                                ? "ring-1 ring-white/40 opacity-100"
                                                : "opacity-50 hover:opacity-75"
                                                }`}
                                            style={{
                                                background: `${label.color}22`,
                                                color: label.color,
                                                ...(isAssigned && { ringColor: label.color }),
                                            }}
                                        >
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ background: label.color }}
                                            />
                                            {label.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            className="rounded-lg p-2 text-velora-text-subtle transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!editContent.trim()}
                            className="rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink p-2 text-white transition-all hover:scale-105 disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                    </div>
                </GlassPanel>
            </motion.div>
        );
    }

    // View mode
    const dueDateStr = formatDueDate(task.dueDate);
    const overdue = isOverdue(task.dueDate);
    const taskLabels = task.labels ?? [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            draggable
            onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
            className="group cursor-grab active:cursor-grabbing"
        >
            <GlassPanel intensity="light" hoverable className="relative p-3">
                <button
                    onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                    className="absolute right-2 top-2 rounded p-1 text-velora-text-subtle opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="mb-2 flex items-center justify-between">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {task.priority}
                    </span>
                    <GripVertical className="h-4 w-4 text-velora-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <p
                    onClick={() => setIsEditing(true)}
                    className="cursor-text text-sm leading-relaxed text-white transition-colors hover:text-velora-text-muted"
                >
                    {task.content}
                </p>

                {/* Labels */}
                {taskLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {taskLabels.map((label) => (
                            <span
                                key={label.id}
                                className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs"
                                style={{ background: `${label.color}22`, color: label.color }}
                            >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: label.color }} />
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Due Date */}
                {dueDateStr && (
                    <div className={`mt-2 flex items-center gap-1 text-xs ${overdue ? "text-red-400" : "text-velora-text-subtle"}`}>
                        <Calendar className="h-3 w-3" />
                        {dueDateStr}
                    </div>
                )}
            </GlassPanel>
        </motion.div>
    );
}

export default TaskCard;
