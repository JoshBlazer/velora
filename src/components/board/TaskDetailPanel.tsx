"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar, MessageSquare, Send, User } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Task, Label, Comment, BoardMember } from "@/lib/types";
import { Priority } from "@prisma/client";
import { formatDueDate, isOverdue, toDateInputValue } from "@/lib/date-utils";
import { toast } from "sonner";

interface TaskDetailPanelProps {
    task: Task;
    boardLabels: Label[];
    boardMembers: BoardMember[];
    currentUserId: string;
    onClose: () => void;
    onUpdate: (taskId: string, content: string, priority: Priority, dueDate: Date | null, assigneeId: string | null) => void;
    onDelete: (taskId: string) => void;
    onToggleLabel: (taskId: string, labelId: string, assigned: boolean) => void;
}

function Avatar({ user, size = "sm" }: { user: { name: string | null; image: string | null } | null | undefined; size?: "sm" | "md" }) {
    const sz = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";
    if (!user) return null;
    return user.image ? (
        <img src={user.image} alt={user.name ?? ""} className={`${sz} rounded-full object-cover`} />
    ) : (
        <div className={`${sz} flex items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan/40 to-velora-pink/40 font-semibold text-white`}>
            {(user.name ?? "?")[0].toUpperCase()}
        </div>
    );
}

function timeAgo(date: string | Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export function TaskDetailPanel({
    task,
    boardLabels,
    boardMembers,
    currentUserId,
    onClose,
    onUpdate,
    onDelete,
    onToggleLabel,
}: TaskDetailPanelProps) {
    const [content, setContent] = useState(task.content);
    const [priority, setPriority] = useState<Priority>(task.priority);
    const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
    const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId ?? null);
    const [isDirty, setIsDirty] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const commentEndRef = useRef<HTMLDivElement>(null);

    const assignedLabelIds = new Set((task.labels ?? []).map((l) => l.id));

    useEffect(() => {
        fetch(`/api/tasks/${task.id}/comments`)
            .then((r) => r.json())
            .then((data) => setComments(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, [task.id]);

    useEffect(() => {
        setIsDirty(
            content !== task.content ||
            priority !== task.priority ||
            dueDate !== toDateInputValue(task.dueDate) ||
            assigneeId !== (task.assigneeId ?? null)
        );
    }, [content, priority, dueDate, assigneeId, task]);

    const handleSave = () => {
        if (!content.trim()) return;
        const due = dueDate ? new Date(dueDate) : null;
        onUpdate(task.id, content.trim(), priority, due, assigneeId);
        setIsDirty(false);
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/tasks/${task.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: commentText.trim() }),
            });
            if (!res.ok) throw new Error();
            const newComment = await res.json();
            setComments((prev) => [...prev, newComment]);
            setCommentText("");
            setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } catch {
            toast.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch {
            toast.error("Failed to delete comment");
        }
    };

    const dueDateStr = formatDueDate(task.dueDate);
    const overdue = isOverdue(task.dueDate);

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col"
            >
                <GlassPanel intensity="heavy" className="flex h-full flex-col p-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <span className="font-semibold text-white">Task Detail</span>
                        <div className="flex items-center gap-2">
                            {!isDeleting ? (
                                <button
                                    onClick={() => setIsDeleting(true)}
                                    className="rounded p-1.5 text-velora-text-subtle hover:bg-red-500/10 hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-400">Delete?</span>
                                    <button
                                        onClick={() => setIsDeleting(false)}
                                        className="rounded px-2 py-1 text-xs text-velora-text-muted hover:bg-white/10"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={() => { onDelete(task.id); onClose(); }}
                                        className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                                    >
                                        Yes
                                    </button>
                                </div>
                            )}
                            <button onClick={onClose} className="rounded p-1.5 text-velora-text-subtle hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-5 space-y-5">
                            {/* Content */}
                            <div>
                                <label className="mb-1.5 block text-xs text-velora-text-subtle">Title</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={3}
                                    className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="mb-1.5 block text-xs text-velora-text-subtle">Priority</label>
                                <div className="flex gap-2">
                                    {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                                                priority === p
                                                    ? p === "LOW" ? "bg-velora-cyan/20 text-velora-cyan ring-1 ring-velora-cyan/30"
                                                    : p === "MEDIUM" ? "bg-velora-pink/20 text-velora-pink ring-1 ring-velora-pink/30"
                                                    : "bg-velora-purple/20 text-velora-purple ring-1 ring-velora-purple/30"
                                                    : "bg-white/5 text-velora-text-subtle hover:bg-white/10"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs text-velora-text-subtle">
                                    <Calendar className="h-3 w-3" />
                                    Due Date
                                    {dueDateStr && (
                                        <span className={`ml-1 ${overdue ? "text-red-400" : "text-velora-text-subtle"}`}>
                                            ({dueDateStr})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50 [color-scheme:dark]"
                                />
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs text-velora-text-subtle">
                                    <User className="h-3 w-3" />
                                    Assignee
                                </label>
                                <select
                                    value={assigneeId ?? ""}
                                    onChange={(e) => setAssigneeId(e.target.value || null)}
                                    className="w-full rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50 [color-scheme:dark]"
                                >
                                    <option value="">Unassigned</option>
                                    {boardMembers.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.user?.name ?? m.user?.email ?? m.userId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Labels */}
                            {boardLabels.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-xs text-velora-text-subtle">Labels</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {boardLabels.map((label) => {
                                            const isAssigned = assignedLabelIds.has(label.id);
                                            return (
                                                <button
                                                    key={label.id}
                                                    onClick={() => onToggleLabel(task.id, label.id, !isAssigned)}
                                                    className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-all ${isAssigned ? "ring-1 ring-white/40 opacity-100" : "opacity-50 hover:opacity-75"}`}
                                                    style={{ background: `${label.color}22`, color: label.color }}
                                                >
                                                    <span className="h-2 w-2 rounded-full" style={{ background: label.color }} />
                                                    {label.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {isDirty && (
                                <button
                                    onClick={handleSave}
                                    disabled={!content.trim()}
                                    className="w-full rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                                >
                                    Save Changes
                                </button>
                            )}

                            {/* Comments */}
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-velora-text-subtle" />
                                    <span className="text-sm font-medium text-white">
                                        Comments {comments.length > 0 && `(${comments.length})`}
                                    </span>
                                </div>

                                {comments.length > 0 && (
                                    <div className="mb-3 space-y-3">
                                        {comments.map((c) => (
                                            <div key={c.id} className="flex gap-2.5">
                                                <Avatar user={c.user ?? null} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs font-medium text-white">
                                                            {c.user?.name ?? "User"}
                                                        </span>
                                                        <span className="text-xs text-velora-text-subtle">
                                                            {timeAgo(c.createdAt)}
                                                        </span>
                                                        {c.userId === currentUserId && (
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                className="ml-auto text-velora-text-subtle hover:text-red-400"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-sm text-velora-text-muted break-words">
                                                        {c.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={commentEndRef} />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                                        placeholder="Add a comment..."
                                        className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder-velora-text-subtle transition-all focus:ring-velora-cyan/50"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim() || submitting}
                                        className="rounded-lg bg-velora-cyan/20 p-2 text-velora-cyan hover:bg-velora-cyan/30 disabled:opacity-40"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassPanel>
            </motion.div>
        </>
    );
}
