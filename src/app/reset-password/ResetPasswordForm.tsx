"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";

export function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords don't match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Something went wrong");
            }

            setDone(true);
            setTimeout(() => router.push("/login"), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (done) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="mb-4 flex justify-center">
                    <CheckCircle className="h-12 w-12 text-velora-cyan" />
                </div>
                <h1 className="mb-2 text-xl font-bold text-white">Password updated</h1>
                <p className="mb-6 text-sm text-velora-text-muted">
                    Your password has been changed. Redirecting you to sign in...
                </p>
                <Link
                    href="/login"
                    className="text-sm font-medium text-velora-cyan transition-colors hover:text-velora-pink"
                >
                    Go to sign in
                </Link>
            </motion.div>
        );
    }

    return (
        <>
            <h1 className="mb-2 text-center text-2xl font-bold text-white">
                New password
            </h1>
            <p className="mb-8 text-center text-sm text-velora-text-muted">
                Choose a password you haven&apos;t used before.
            </p>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="mb-2 block text-sm font-medium text-velora-text-muted">
                        New password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-velora-text-subtle" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            minLength={8}
                            required
                            className="w-full rounded-lg bg-white/5 py-3 pl-12 pr-4 text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-velora-text-muted">
                        Confirm password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-velora-text-subtle" />
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Same password again"
                            required
                            className="w-full rounded-lg bg-white/5 py-3 pl-12 pr-4 text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-velora-cyan/25 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isLoading ? "Saving..." : "Set New Password"}
                </button>
            </form>
        </>
    );
}
