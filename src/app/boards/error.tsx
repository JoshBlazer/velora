"use client";

import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function BoardsError({
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <GlassLayout>
            <div className="flex min-h-screen items-center justify-center p-6">
                <GlassPanel intensity="medium" className="max-w-sm p-8 text-center">
                    <p className="mb-2 text-lg font-semibold text-white">Something went wrong</p>
                    <p className="mb-6 text-sm text-velora-text-muted">
                        Couldn't load your boards. Try again.
                    </p>
                    <button
                        onClick={reset}
                        className="rounded-lg bg-velora-cyan/20 px-4 py-2 text-sm font-medium text-velora-cyan transition-colors hover:bg-velora-cyan/30"
                    >
                        Try again
                    </button>
                </GlassPanel>
            </div>
        </GlassLayout>
    );
}
