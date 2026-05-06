"use client";

import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Plus, Activity } from "lucide-react";
import Link from "next/link";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Column } from "@/components/board/Column";
import { BoardSettings } from "@/components/board/BoardSettings";
import { KeyboardShortcuts } from "@/components/board/KeyboardShortcuts";
import { SearchFilterBar } from "@/components/board/SearchFilterBar";
import { ActivityPanel } from "@/components/board/ActivityPanel";
import { AddTaskFormHandle } from "@/components/board/AddTaskForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BoardWithColumns, ColumnWithTasks, Label, Task } from "@/lib/types";
import { Priority } from "@prisma/client";
import { isOverdue } from "@/lib/date-utils";

interface BoardClientProps {
    initialBoard: BoardWithColumns;
    isOwner: boolean;
}

export function BoardClient({ initialBoard, isOwner }: BoardClientProps) {
    const [board, setBoard] = useState<BoardWithColumns>(initialBoard);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [activityOpen, setActivityOpen] = useState(false);
    const firstColumnAddFormRef = useRef<AddTaskFormHandle | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
    const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
    const [overdueOnly, setOverdueOnly] = useState(false);

    const filterActive = !!(searchQuery || priorityFilter || activeLabelId || overdueOnly);

    const getVisibleTaskIds = useCallback(
        (tasks: Task[]): Set<string> | undefined => {
            if (!filterActive) return undefined;
            return new Set(
                tasks
                    .filter((t) => {
                        if (searchQuery && !t.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                        if (priorityFilter && t.priority !== priorityFilter) return false;
                        if (activeLabelId && !(t.labels ?? []).some((l) => l.id === activeLabelId)) return false;
                        if (overdueOnly && !isOverdue(t.dueDate)) return false;
                        return true;
                    })
                    .map((t) => t.id)
            );
        },
        [filterActive, searchQuery, priorityFilter, activeLabelId, overdueOnly]
    );

    const allTasks = board.columns.flatMap((c) => c.tasks);
    const totalCount = allTasks.length;
    const matchCount = filterActive
        ? allTasks.filter((t) => {
              if (searchQuery && !t.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
              if (priorityFilter && t.priority !== priorityFilter) return false;
              if (activeLabelId && !(t.labels ?? []).some((l) => l.id === activeLabelId)) return false;
              if (overdueOnly && !isOverdue(t.dueDate)) return false;
              return true;
          }).length
        : totalCount;

    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", taskId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent, targetColumnId: string, insertIndex: number) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData("text/plain");
            if (!taskId) return;

            let sourceColumn: ColumnWithTasks | undefined;
            let task: Task | undefined;

            for (const col of board.columns) {
                const found = col.tasks.find((t) => t.id === taskId);
                if (found) { sourceColumn = col; task = found; break; }
            }

            if (!sourceColumn || !task) return;

            const isSameColumn = sourceColumn.id === targetColumnId;

            // For same-column reorder, skip if position didn't change
            if (isSameColumn) {
                const currentIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId);
                if (insertIndex === currentIndex || insertIndex === currentIndex + 1) {
                    setDraggedTaskId(null);
                    return;
                }
            }

            // Optimistic update
            setBoard((prev) => {
                const newColumns = prev.columns.map((col) => {
                    if (isSameColumn && col.id === targetColumnId) {
                        const tasks = col.tasks.filter((t) => t.id !== taskId);
                        const adjustedIndex = insertIndex > col.tasks.findIndex((t) => t.id === taskId)
                            ? insertIndex - 1
                            : insertIndex;
                        tasks.splice(Math.max(0, adjustedIndex), 0, task!);
                        return { ...col, tasks };
                    }
                    if (!isSameColumn && col.id === sourceColumn!.id) {
                        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
                    }
                    if (!isSameColumn && col.id === targetColumnId) {
                        const tasks = [...col.tasks];
                        tasks.splice(insertIndex, 0, { ...task!, columnId: targetColumnId });
                        return { ...col, tasks };
                    }
                    return col;
                });
                return { ...prev, columns: newColumns };
            });

            setDraggedTaskId(null);

            try {
                const res = await fetch("/api/tasks/move", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId, targetColumnId, newOrder: insertIndex }),
                });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to move task:", error);
                toast.error("Failed to move task");
                setBoard(initialBoard);
            }
        },
        [board, initialBoard]
    );

    const handleAddTask = useCallback(
        async (columnId: string, content: string, priority: Priority) => {
            const tempId = `temp-${Date.now()}`;
            const newTask: Task = {
                id: tempId,
                content,
                priority,
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                columnId,
                dueDate: null,
                labels: [],
            };

            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.map((col) =>
                    col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
                ),
            }));

            try {
                const res = await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content, priority, columnId }),
                });
                if (!res.ok) throw new Error();
                const created = await res.json();
                setBoard((prev) => ({
                    ...prev,
                    columns: prev.columns.map((col) =>
                        col.id === columnId
                            ? { ...col, tasks: col.tasks.map((t) => (t.id === tempId ? created : t)) }
                            : col
                    ),
                }));
            } catch (error) {
                console.error("Failed to create task:", error);
                toast.error("Failed to create task");
                setBoard((prev) => ({
                    ...prev,
                    columns: prev.columns.map((col) =>
                        col.id === columnId
                            ? { ...col, tasks: col.tasks.filter((t) => t.id !== tempId) }
                            : col
                    ),
                }));
            }
        },
        []
    );

    const handleUpdateTask = useCallback(
        async (taskId: string, content: string, priority: Priority, dueDate: Date | null) => {
            let originalTask: Task | undefined;
            for (const col of board.columns) {
                const found = col.tasks.find((t) => t.id === taskId);
                if (found) { originalTask = found; break; }
            }

            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.map((col) => ({
                    ...col,
                    tasks: col.tasks.map((t) =>
                        t.id === taskId ? { ...t, content, priority, dueDate, updatedAt: new Date() } : t
                    ),
                })),
            }));

            try {
                const res = await fetch("/api/tasks", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: taskId,
                        content,
                        priority,
                        dueDate: dueDate ? dueDate.toISOString() : null,
                    }),
                });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to update task:", error);
                toast.error("Failed to update task");
                if (originalTask) {
                    setBoard((prev) => ({
                        ...prev,
                        columns: prev.columns.map((col) => ({
                            ...col,
                            tasks: col.tasks.map((t) => (t.id === taskId ? originalTask! : t)),
                        })),
                    }));
                }
            }
        },
        [board.columns]
    );

    const handleDeleteTask = useCallback(
        async (taskId: string) => {
            let originalTask: Task | undefined;
            let originalColumnId: string | undefined;
            for (const col of board.columns) {
                const found = col.tasks.find((t) => t.id === taskId);
                if (found) { originalTask = found; originalColumnId = col.id; break; }
            }

            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.map((col) => ({
                    ...col,
                    tasks: col.tasks.filter((t) => t.id !== taskId),
                })),
            }));

            try {
                const res = await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to delete task:", error);
                toast.error("Failed to delete task");
                if (originalTask && originalColumnId) {
                    setBoard((prev) => ({
                        ...prev,
                        columns: prev.columns.map((col) =>
                            col.id === originalColumnId
                                ? { ...col, tasks: [...col.tasks, originalTask!] }
                                : col
                        ),
                    }));
                }
            }
        },
        [board.columns]
    );

    const handleToggleTaskLabel = useCallback(
        async (taskId: string, labelId: string, assigned: boolean) => {
            const label = board.labels.find((l) => l.id === labelId);
            if (!label) return;

            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.map((col) => ({
                    ...col,
                    tasks: col.tasks.map((t) =>
                        t.id === taskId
                            ? {
                                ...t,
                                labels: assigned
                                    ? [...(t.labels ?? []), label]
                                    : (t.labels ?? []).filter((l) => l.id !== labelId),
                            }
                            : t
                    ),
                })),
            }));

            try {
                const res = await fetch(`/api/tasks/${taskId}/labels${!assigned ? `?labelId=${labelId}` : ""}`, {
                    method: assigned ? "POST" : "DELETE",
                    headers: assigned ? { "Content-Type": "application/json" } : undefined,
                    body: assigned ? JSON.stringify({ labelId }) : undefined,
                });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to toggle label:", error);
                toast.error("Failed to update label");
                setBoard((prev) => ({
                    ...prev,
                    columns: prev.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) =>
                            t.id === taskId
                                ? {
                                    ...t,
                                    labels: assigned
                                        ? (t.labels ?? []).filter((l) => l.id !== labelId)
                                        : [...(t.labels ?? []), label],
                                }
                                : t
                        ),
                    })),
                }));
            }
        },
        [board.labels]
    );

    const handleAddLabel = useCallback(
        async (name: string, color: string) => {
            const tempId = `temp-label-${Date.now()}`;
            const tempLabel: Label = {
                id: tempId, name, color, boardId: board.id,
                createdAt: new Date(), updatedAt: new Date(),
            };

            setBoard((prev) => ({ ...prev, labels: [...prev.labels, tempLabel] }));

            try {
                const res = await fetch("/api/labels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ boardId: board.id, name, color }),
                });
                if (!res.ok) throw new Error();
                const created = await res.json();
                setBoard((prev) => ({
                    ...prev,
                    labels: prev.labels.map((l) => (l.id === tempId ? created : l)),
                }));
            } catch (error) {
                console.error("Failed to create label:", error);
                toast.error("Failed to create label");
                setBoard((prev) => ({ ...prev, labels: prev.labels.filter((l) => l.id !== tempId) }));
            }
        },
        [board.id]
    );

    const handleDeleteLabel = useCallback(
        async (labelId: string) => {
            const label = board.labels.find((l) => l.id === labelId);

            setBoard((prev) => ({
                ...prev,
                labels: prev.labels.filter((l) => l.id !== labelId),
                columns: prev.columns.map((col) => ({
                    ...col,
                    tasks: col.tasks.map((t) => ({
                        ...t,
                        labels: (t.labels ?? []).filter((l) => l.id !== labelId),
                    })),
                })),
            }));

            try {
                const res = await fetch(`/api/labels/${labelId}`, { method: "DELETE" });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to delete label:", error);
                toast.error("Failed to delete label");
                if (label) {
                    setBoard((prev) => ({ ...prev, labels: [...prev.labels, label] }));
                }
            }
        },
        [board.labels]
    );

    const handleRenameColumn = useCallback(
        async (columnId: string, title: string) => {
            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.map((col) =>
                    col.id === columnId ? { ...col, title } : col
                ),
            }));

            try {
                const res = await fetch(`/api/columns/${columnId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title }),
                });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to rename column:", error);
                toast.error("Failed to rename column");
                setBoard(initialBoard);
            }
        },
        [initialBoard]
    );

    const handleDeleteColumn = useCallback(
        async (columnId: string) => {
            const originalColumns = board.columns;
            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.filter((col) => col.id !== columnId),
            }));

            try {
                const res = await fetch(`/api/columns/${columnId}`, { method: "DELETE" });
                if (!res.ok) throw new Error();
            } catch (error) {
                console.error("Failed to delete column:", error);
                toast.error("Failed to delete column");
                setBoard((prev) => ({ ...prev, columns: originalColumns }));
            }
        },
        [board.columns]
    );

    const handleAddColumn = useCallback(async () => {
        const tempId = `temp-col-${Date.now()}`;
        const newColumn: ColumnWithTasks = {
            id: tempId,
            title: "New Column",
            order: board.columns.length,
            createdAt: new Date(),
            updatedAt: new Date(),
            boardId: board.id,
            tasks: [],
        };

        setBoard((prev) => ({ ...prev, columns: [...prev.columns, newColumn] }));

        try {
            const res = await fetch("/api/columns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boardId: board.id, title: "New Column" }),
            });
            if (!res.ok) throw new Error();
            const created = await res.json();
            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.map((col) => (col.id === tempId ? created : col)),
            }));
        } catch (error) {
            console.error("Failed to create column:", error);
            toast.error("Failed to create column");
            setBoard((prev) => ({
                ...prev,
                columns: prev.columns.filter((col) => col.id !== tempId),
            }));
        }
    }, [board.id, board.columns.length]);

    return (
        <GlassLayout background={board.background ?? undefined}>
            <div className="min-h-screen p-6">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/boards"
                                className="flex items-center gap-2 text-velora-text-muted transition-colors hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="text-sm">Back</span>
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">Velora</span>
                            </div>
                        </div>

                        <GlassPanel intensity="light" className="px-6 py-3">
                            <h1 className="text-lg font-semibold text-white">{board.title}</h1>
                        </GlassPanel>

                        <div className="flex items-center gap-3">
                            {board.user && (
                                <>
                                    <span className="text-sm text-velora-text-muted">{board.user.name}</span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan/50 to-velora-pink/50 text-sm font-medium text-white">
                                        {board.user.name?.charAt(0) || "U"}
                                    </div>
                                </>
                            )}
                            <button
                                onClick={() => setActivityOpen(true)}
                                title="Activity log"
                                className="rounded-lg p-2 text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <Activity className="h-5 w-5" />
                            </button>
                            <ThemeToggle />
                            <BoardSettings
                                boardId={board.id}
                                boardTitle={board.title}
                                boardBackground={board.background}
                                boardLabels={board.labels}
                                isOwner={isOwner}
                                onTitleUpdate={(t) => setBoard((prev) => ({ ...prev, title: t }))}
                                onBackgroundUpdate={(bg) => setBoard((prev) => ({ ...prev, background: bg }))}
                                onAddLabel={handleAddLabel}
                                onDeleteLabel={handleDeleteLabel}
                            />
                        </div>
                    </div>
                </motion.header>

                {/* Search & Filter */}
                <SearchFilterBar
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    priority={priorityFilter}
                    onPriorityChange={setPriorityFilter}
                    activeLabelId={activeLabelId}
                    onLabelChange={setActiveLabelId}
                    overdueOnly={overdueOnly}
                    onOverdueChange={setOverdueOnly}
                    boardLabels={board.labels}
                    matchCount={matchCount}
                    totalCount={totalCount}
                />

                {/* Board Columns */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex gap-6 overflow-x-auto pb-4"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {board.columns.map((column, index) => (
                        <motion.div
                            key={column.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            className="min-w-[300px] flex-shrink-0"
                            style={{ scrollSnapAlign: "start" }}
                        >
                            <Column
                                column={column}
                                boardLabels={board.labels}
                                addFormRef={index === 0 ? firstColumnAddFormRef : undefined}
                                visibleTaskIds={getVisibleTaskIds(column.tasks)}
                                filterActive={filterActive}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onAddTask={handleAddTask}
                                onUpdateTask={handleUpdateTask}
                                onDeleteTask={handleDeleteTask}
                                onToggleTaskLabel={handleToggleTaskLabel}
                                onRenameColumn={handleRenameColumn}
                                onDeleteColumn={handleDeleteColumn}
                            />
                        </motion.div>
                    ))}

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 * board.columns.length }}
                    >
                        <button
                            onClick={handleAddColumn}
                            className="flex h-full min-h-[500px] w-[300px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 text-velora-text-subtle transition-all hover:border-velora-cyan/30 hover:bg-white/5 hover:text-velora-cyan"
                        >
                            <Plus className="h-8 w-8" />
                            <span className="text-sm font-medium">Add Column</span>
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            <ActivityPanel
                boardId={board.id}
                isOpen={activityOpen}
                onClose={() => setActivityOpen(false)}
            />

            <KeyboardShortcuts
                onNewTask={() => firstColumnAddFormRef.current?.open()}
            />
        </GlassLayout>
    );
}

export default BoardClient;
