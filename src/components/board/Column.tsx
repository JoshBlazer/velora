"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TaskCard } from "./TaskCard";
import { AddTaskForm, AddTaskFormHandle } from "./AddTaskForm";
import { ColumnWithTasks, Label } from "@/lib/types";
import { Priority } from "@prisma/client";
import { MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";

interface ColumnProps {
    column: ColumnWithTasks;
    boardLabels: Label[];
    addFormRef?: React.RefObject<AddTaskFormHandle | null>;
    visibleTaskIds?: Set<string>;
    filterActive?: boolean;
    selectedTaskIds: Set<string>;
    bulkMode: boolean;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, columnId: string, insertIndex: number) => void;
    onAddTask: (columnId: string, content: string, priority: Priority) => void;
    onDeleteTask: (taskId: string) => void;
    onOpenDetail: (taskId: string) => void;
    onToggleSelect: (taskId: string) => void;
    onRenameColumn?: (columnId: string, title: string) => void;
    onDeleteColumn?: (columnId: string) => void;
}

export function Column({
    column,
    boardLabels,
    addFormRef,
    visibleTaskIds,
    filterActive,
    selectedTaskIds,
    bulkMode,
    onDragStart,
    onDragOver,
    onDrop,
    onAddTask,
    onDeleteTask,
    onOpenDetail,
    onToggleSelect,
    onRenameColumn,
    onDeleteColumn,
}: ColumnProps) {
    const displayTasks = visibleTaskIds
        ? column.tasks.filter((t) => visibleTaskIds.has(t.id))
        : column.tasks;
    const visibleCount = displayTasks.length;
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);
    const localAddFormRef = useRef<AddTaskFormHandle | null>(null);
    const effectiveRef = addFormRef ?? localAddFormRef;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e);
        if (dragOverIndex === null) setDragOverIndex(column.tasks.length);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const insertAt = dragOverIndex ?? column.tasks.length;
        setIsDragOver(false);
        setDragOverIndex(null);
        onDrop(e, column.id, insertAt);
    };

    const handleSaveTitle = () => {
        if (editTitle.trim() && editTitle !== column.title && onRenameColumn) {
            onRenameColumn(column.id, editTitle.trim());
        }
        setIsEditing(false);
    };

    const handleDeleteColumn = () => {
        if (onDeleteColumn) onDeleteColumn(column.id);
        setIsDeleting(false);
        setIsMenuOpen(false);
    };

    const disableDnd = filterActive || bulkMode;

    return (
        <GlassPanel
            intensity="medium"
            role="region"
            aria-label={column.title}
            className={`flex h-full min-h-[500px] flex-col p-4 transition-all ${isDragOver && !disableDnd ? "ring-2 ring-velora-cyan/50" : ""}`}
            onDragOver={disableDnd ? undefined : handleDragOver}
            onDragLeave={disableDnd ? undefined : handleDragLeave}
            onDrop={disableDnd ? undefined : handleDrop}
        >
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between">
                {isEditing ? (
                    <div className="flex flex-1 items-center gap-2">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveTitle();
                                if (e.key === "Escape") { setEditTitle(column.title); setIsEditing(false); }
                            }}
                            autoFocus
                            className="flex-1 rounded bg-white/10 px-2 py-1 text-sm font-semibold uppercase tracking-wider text-white outline-none ring-1 ring-white/20 focus:ring-velora-cyan/50"
                        />
                        <button onClick={() => { setEditTitle(column.title); setIsEditing(false); }} className="rounded p-1 text-velora-text-subtle hover:bg-white/10">
                            <X className="h-4 w-4" />
                        </button>
                        <button onClick={handleSaveTitle} className="rounded bg-velora-cyan/20 p-1 text-velora-cyan hover:bg-velora-cyan/30">
                            <Check className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-velora-text-muted">
                            {column.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-velora-text-subtle"
                                aria-label={filterActive ? `${visibleCount} of ${column.tasks.length} tasks` : `${column.tasks.length} tasks`}
                            >
                                {filterActive ? `${visibleCount}/${column.tasks.length}` : column.tasks.length}
                            </span>
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    aria-label={`Column options for ${column.title}`}
                                    aria-expanded={isMenuOpen}
                                    aria-haspopup="menu"
                                    className="rounded p-1 text-velora-text-subtle opacity-0 transition-opacity hover:bg-white/10 hover:text-white [.group:hover_&]:opacity-100"
                                    style={{ opacity: isMenuOpen ? 1 : undefined }}
                                >
                                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => { setIsMenuOpen(false); setIsDeleting(false); }} />
                                        <div className="absolute right-0 top-8 z-50 w-40">
                                            <GlassPanel intensity="heavy" className="p-1">
                                                {isDeleting ? (
                                                    <div className="p-2">
                                                        <p className="mb-2 text-xs text-velora-text-muted">
                                                            Delete column{column.tasks.length > 0 ? ` and ${column.tasks.length} task${column.tasks.length > 1 ? "s" : ""}` : ""}?
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setIsDeleting(false)} className="flex-1 rounded bg-white/10 px-2 py-1 text-xs text-velora-text-muted hover:bg-white/20">Cancel</button>
                                                            <button onClick={handleDeleteColumn} className="flex-1 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30">Delete</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-velora-text-muted hover:bg-white/10 hover:text-white">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Rename
                                                        </button>
                                                        <button onClick={() => setIsDeleting(true)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </GlassPanel>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-3 overflow-y-auto" role="list" aria-label={`Tasks in ${column.title}`}>
                <AnimatePresence mode="popLayout">
                    {displayTasks.map((task, index) => (
                        <div
                            key={task.id}
                            role="listitem"
                            onDragOver={disableDnd ? undefined : (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragOver(true);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDragOverIndex(e.clientY < rect.top + rect.height / 2 ? index : index + 1);
                            }}
                        >
                            {!disableDnd && isDragOver && dragOverIndex === index && (
                                <div className="mb-2 h-0.5 w-full rounded-full bg-velora-cyan" aria-hidden="true" />
                            )}
                            <TaskCard
                                task={task}
                                boardLabels={boardLabels}
                                isSelected={selectedTaskIds.has(task.id)}
                                bulkMode={bulkMode}
                                onDragStart={disableDnd ? () => {} : onDragStart}
                                onDelete={onDeleteTask}
                                onOpenDetail={onOpenDetail}
                                onToggleSelect={onToggleSelect}
                            />
                        </div>
                    ))}
                </AnimatePresence>

                {!disableDnd && isDragOver && dragOverIndex === column.tasks.length && (
                    <div className="h-0.5 w-full rounded-full bg-velora-cyan" aria-hidden="true" />
                )}

                {filterActive && displayTasks.length === 0 && (
                    <p className="py-4 text-center text-sm text-velora-text-subtle" role="status">No matching tasks</p>
                )}
            </div>

            {/* Add Task */}
            {!bulkMode && (
                <div className="mt-4 border-t border-white/10 pt-4">
                    <AddTaskForm
                        ref={effectiveRef}
                        columnId={column.id}
                        onAdd={(content, priority) => onAddTask(column.id, content, priority)}
                    />
                </div>
            )}
        </GlassPanel>
    );
}

export default Column;
