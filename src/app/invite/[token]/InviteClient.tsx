"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Users } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface InviteClientProps {
    token: string;
    boardTitle: string;
    ownerName: string | null;
    role: string;
    userEmail: string;
}

export function InviteClient({ token, boardTitle, ownerName, role, userEmail }: InviteClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/invites/${token}`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to accept invite");
                return;
            }
            router.push(`/board/${data.boardId}`);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const roleLabel = role === "VIEWER" ? "viewer" : "editor";

    return (
        <GlassLayout>
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                    </div>

                    <GlassPanel intensity="medium" className="p-8 text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-velora-cyan/20">
                                <Users className="h-6 w-6 text-velora-cyan" />
                            </div>
                        </div>

                        <h1 className="mb-2 text-2xl font-bold text-white">Board Invite</h1>
                        <p className="mb-6 text-velora-text-muted">
                            <strong className="text-white">{ownerName ?? "A teammate"}</strong> invited you to collaborate on{" "}
                            <strong className="text-white">{boardTitle}</strong> as a{" "}
                            <span className="text-velora-cyan">{roleLabel}</span>.
                        </p>

                        <p className="mb-6 text-sm text-velora-text-subtle">
                            Joining as <span className="text-white">{userEmail}</span>
                        </p>

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleAccept}
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-velora-cyan to-velora-pink py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? "Joining..." : "Accept Invite"}
                        </button>
                    </GlassPanel>
                </div>
            </div>
        </GlassLayout>
    );
}
