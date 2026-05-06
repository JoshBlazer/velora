"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface KeyboardShortcutsProps {
    onNewTask?: () => void;
}

const shortcuts = [
    { key: "N", description: "New task in first column" },
    { key: "?", description: "Show keyboard shortcuts" },
    { key: "Esc", description: "Close modal / cancel edit" },
];

export function KeyboardShortcuts({ onNewTask }: KeyboardShortcutsProps) {
    const [showHelp, setShowHelp] = useState(false);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case "n":
                    e.preventDefault();
                    onNewTask?.();
                    break;
                case "?":
                    e.preventDefault();
                    setShowHelp(true);
                    break;
                case "escape":
                    setShowHelp(false);
                    break;
            }
        },
        [onNewTask]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {/* Help Button */}
            <button
                onClick={() => setShowHelp(true)}
                className="fixed bottom-6 right-6 z-40 rounded-full bg-white/10 p-3 text-velora-text-muted backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                title="Keyboard shortcuts (?)"
            >
                <Keyboard className="h-5 w-5" />
            </button>

            {/* Help Modal */}
            <AnimatePresence>
                {showHelp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowHelp(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
                        >
                            <GlassPanel intensity="heavy" className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">
                                        Keyboard Shortcuts
                                    </h2>
                                    <button
                                        onClick={() => setShowHelp(false)}
                                        className="rounded p-1 text-velora-text-subtle hover:bg-white/10 hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {shortcuts.map((shortcut) => (
                                        <div
                                            key={shortcut.key}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="text-sm text-velora-text-muted">
                                                {shortcut.description}
                                            </span>
                                            <kbd className="rounded bg-white/10 px-2 py-1 font-mono text-xs text-white">
                                                {shortcut.key}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </GlassPanel>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
