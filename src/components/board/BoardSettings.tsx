"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Settings, Pencil, Trash2, X, Check, Palette, Tag, Plus } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Label, BOARD_BACKGROUNDS, LABEL_COLORS } from "@/lib/types";

type View = "main" | "renaming" | "deleting" | "background" | "labels";

interface BoardSettingsProps {
    boardId: string;
    boardTitle: string;
    boardBackground: string | null;
    boardLabels: Label[];
    onTitleUpdate: (title: string) => void;
    onBackgroundUpdate: (background: string) => void;
    onAddLabel: (name: string, color: string) => void;
    onDeleteLabel: (labelId: string) => void;
}

export function BoardSettings({
    boardId,
    boardTitle,
    boardBackground,
    boardLabels,
    onTitleUpdate,
    onBackgroundUpdate,
    onAddLabel,
    onDeleteLabel,
}: BoardSettingsProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<View>("main");
    const [title, setTitle] = useState(boardTitle);
    const [isLoading, setIsLoading] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const [newLabelColor, setNewLabelColor] = useState<string>(LABEL_COLORS[0]);

    const close = () => {
        setIsOpen(false);
        setView("main");
    };

    const handleSaveTitle = async () => {
        if (!title.trim() || title === boardTitle) {
            setView("main");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim() }),
            });
            if (res.ok) {
                onTitleUpdate(title.trim());
                setView("main");
            } else {
                toast.error("Failed to rename board");
            }
        } catch {
            toast.error("Failed to rename board");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
            if (res.ok) router.push("/boards");
            else toast.error("Failed to delete board");
        } catch {
            toast.error("Failed to delete board");
            setIsLoading(false);
        }
    };

    const handleSelectBackground = async (bg: string) => {
        onBackgroundUpdate(bg);
        try {
            await fetch(`/api/boards/${boardId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ background: bg }),
            });
        } catch {
            toast.error("Failed to update background");
        }
    };

    const handleAddLabel = () => {
        if (!newLabelName.trim()) return;
        onAddLabel(newLabelName.trim(), newLabelColor);
        setNewLabelName("");
        setNewLabelColor(LABEL_COLORS[0]);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-lg p-2 text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
                <Settings className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={close} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-12 z-50 w-72"
                        >
                            <GlassPanel intensity="heavy" className="p-2">

                                {/* Main menu */}
                                {view === "main" && (
                                    <>
                                        <button
                                            onClick={() => setView("renaming")}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Rename Board
                                        </button>
                                        <button
                                            onClick={() => setView("background")}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <Palette className="h-4 w-4" />
                                            Background
                                        </button>
                                        <button
                                            onClick={() => setView("labels")}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <Tag className="h-4 w-4" />
                                            Labels
                                            {boardLabels.length > 0 && (
                                                <span className="ml-auto text-xs text-velora-text-subtle">{boardLabels.length}</span>
                                            )}
                                        </button>
                                        <div className="my-1 border-t border-white/10" />
                                        <button
                                            onClick={() => setView("deleting")}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Board
                                        </button>
                                    </>
                                )}

                                {/* Rename */}
                                {view === "renaming" && (
                                    <div className="p-2">
                                        <div className="mb-2 flex items-center gap-2">
                                            <button onClick={() => setView("main")} className="text-velora-text-subtle hover:text-white">
                                                <X className="h-4 w-4" />
                                            </button>
                                            <span className="text-sm font-medium text-white">Rename Board</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                                            autoFocus
                                            className="mb-2 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-velora-cyan/50"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setTitle(boardTitle); setView("main"); }}
                                                className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-velora-text-muted hover:bg-white/20"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveTitle}
                                                disabled={isLoading}
                                                className="flex-1 rounded-lg bg-velora-cyan/20 px-3 py-1.5 text-sm text-velora-cyan hover:bg-velora-cyan/30"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delete confirm */}
                                {view === "deleting" && (
                                    <div className="p-2">
                                        <p className="mb-3 text-sm text-white">Delete this board and all tasks?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setView("main")}
                                                className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-velora-text-muted hover:bg-white/20"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={isLoading}
                                                className="flex-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/30"
                                            >
                                                {isLoading ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Background picker */}
                                {view === "background" && (
                                    <div className="p-2">
                                        <div className="mb-3 flex items-center gap-2">
                                            <button onClick={() => setView("main")} className="text-velora-text-subtle hover:text-white">
                                                <X className="h-4 w-4" />
                                            </button>
                                            <span className="text-sm font-medium text-white">Background</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BOARD_BACKGROUNDS.map((bg) => {
                                                const isActive = boardBackground === bg.value;
                                                return (
                                                    <button
                                                        key={bg.label}
                                                        onClick={() => handleSelectBackground(bg.value)}
                                                        title={bg.label}
                                                        className={`relative h-12 w-full rounded-lg transition-all ${isActive ? "ring-2 ring-velora-cyan" : "ring-1 ring-white/10 hover:ring-white/30"}`}
                                                        style={{ background: bg.value }}
                                                    >
                                                        {isActive && (
                                                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Labels manager */}
                                {view === "labels" && (
                                    <div className="p-2">
                                        <div className="mb-3 flex items-center gap-2">
                                            <button onClick={() => setView("main")} className="text-velora-text-subtle hover:text-white">
                                                <X className="h-4 w-4" />
                                            </button>
                                            <span className="text-sm font-medium text-white">Labels</span>
                                        </div>

                                        {/* Existing labels */}
                                        {boardLabels.length > 0 && (
                                            <div className="mb-3 space-y-1">
                                                {boardLabels.map((label) => (
                                                    <div
                                                        key={label.id}
                                                        className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="h-3 w-3 rounded-full"
                                                                style={{ background: label.color }}
                                                            />
                                                            <span className="text-sm text-white">{label.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => onDeleteLabel(label.id)}
                                                            className="rounded p-1 text-velora-text-subtle hover:text-red-400"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add new label */}
                                        <div className="border-t border-white/10 pt-3">
                                            <p className="mb-2 text-xs text-velora-text-subtle">New label</p>
                                            <input
                                                type="text"
                                                value={newLabelName}
                                                onChange={(e) => setNewLabelName(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                                                placeholder="Label name..."
                                                maxLength={30}
                                                className="mb-2 w-full rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 placeholder-velora-text-subtle focus:ring-velora-cyan/50"
                                            />
                                            <div className="mb-2 flex flex-wrap gap-1.5">
                                                {LABEL_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setNewLabelColor(color)}
                                                        className={`h-5 w-5 rounded-full transition-all ${newLabelColor === color ? "ring-2 ring-white ring-offset-1 ring-offset-transparent" : "hover:scale-110"}`}
                                                        style={{ background: color }}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleAddLabel}
                                                disabled={!newLabelName.trim()}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Add Label
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </GlassPanel>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
