"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Priority } from "@prisma/client";

interface AddTaskFormProps {
    columnId: string;
    onAdd: (content: string, priority: Priority) => void;
}

export interface AddTaskFormHandle {
    open: () => void;
}

export const AddTaskForm = forwardRef<AddTaskFormHandle, AddTaskFormProps>(
    function AddTaskForm({ columnId: _columnId, onAdd }, ref) {
        const [isOpen, setIsOpen] = useState(false);
        const [content, setContent] = useState("");
        const [priority, setPriority] = useState<Priority>("MEDIUM");
        const [isSubmitting, setIsSubmitting] = useState(false);

        useImperativeHandle(ref, () => ({
            open: () => {
                setIsOpen(true);
                setContent("");
                setPriority("MEDIUM");
            },
        }));

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!content.trim() || isSubmitting) return;

            setIsSubmitting(true);
            try {
                await onAdd(content.trim(), priority);
                setContent("");
                setPriority("MEDIUM");
                setIsOpen(false);
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isOpen) {
            return (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-velora-text-subtle transition-colors hover:bg-white/5 hover:text-white"
                >
                    <Plus className="h-4 w-4" />
                    Add Task
                </button>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <GlassPanel intensity="light" className="p-3">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter task description..."
                            autoFocus
                            className="mb-3 w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                            rows={2}
                        />

                        <div className="mb-3 flex gap-2">
                            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${priority === p
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

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setContent("");
                                }}
                                className="rounded-lg p-2 text-velora-text-subtle transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <button
                                type="submit"
                                disabled={!content.trim() || isSubmitting}
                                className="rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </form>
                </GlassPanel>
            </motion.div>
        );
    }
);

export default AddTaskForm;
