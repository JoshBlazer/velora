"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Layers } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function NewBoardPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isLoading) return;

        setIsLoading(true);

        try {
            const response = await fetch("/api/boards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim() }),
            });

            if (!response.ok) throw new Error("Failed to create board");

            const board = await response.json();
            router.push(`/board/${board.id}`);
        } catch (error) {
            console.error("Error creating board:", error);
            setIsLoading(false);
        }
    };

    return (
        <GlassLayout>
            <div className="flex min-h-screen items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Back Link */}
                    <Link
                        href="/boards"
                        className="mb-8 inline-flex items-center gap-2 text-velora-text-muted transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Boards
                    </Link>

                    <GlassPanel intensity="medium" className="p-8">
                        <div className="mb-6 flex items-center justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                                <Layers className="h-7 w-7 text-white" />
                            </div>
                        </div>

                        <h1 className="mb-2 text-center text-2xl font-bold text-white">
                            Create New Board
                        </h1>
                        <p className="mb-8 text-center text-velora-text-muted">
                            Start organizing your next project
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-velora-text-muted">
                                    Board Name
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="My Awesome Project"
                                    required
                                    autoFocus
                                    className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!title.trim() || isLoading}
                                className="w-full rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-velora-cyan/25 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading ? "Creating..." : "Create Board"}
                            </button>
                        </form>
                    </GlassPanel>
                </motion.div>
            </div>
        </GlassLayout>
    );
}
