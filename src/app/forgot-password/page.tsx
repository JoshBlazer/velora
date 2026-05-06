"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Something went wrong");
            }

            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
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
                    <div className="mb-8 flex items-center justify-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">Velora</span>
                    </div>

                    <GlassPanel intensity="medium" className="p-8">
                        {sent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="mb-4 flex justify-center">
                                    <CheckCircle className="h-12 w-12 text-velora-cyan" />
                                </div>
                                <h1 className="mb-2 text-xl font-bold text-white">Check your email</h1>
                                <p className="mb-6 text-sm text-velora-text-muted">
                                    If an account exists for <span className="text-white">{email}</span>, we sent a password reset link. It expires in 1 hour.
                                </p>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-velora-cyan transition-colors hover:text-velora-pink"
                                >
                                    Back to sign in
                                </Link>
                            </motion.div>
                        ) : (
                            <>
                                <h1 className="mb-2 text-center text-2xl font-bold text-white">
                                    Forgot password?
                                </h1>
                                <p className="mb-8 text-center text-sm text-velora-text-muted">
                                    Enter your email and we'll send a reset link.
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

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-velora-text-muted">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-velora-text-subtle" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
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
                                        {isLoading ? "Sending..." : "Send Reset Link"}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-sm text-velora-text-muted">
                                    <Link
                                        href="/login"
                                        className="font-medium text-velora-cyan transition-colors hover:text-velora-pink"
                                    >
                                        Back to sign in
                                    </Link>
                                </p>
                            </>
                        )}
                    </GlassPanel>
                </motion.div>
            </div>
        </GlassLayout>
    );
}
