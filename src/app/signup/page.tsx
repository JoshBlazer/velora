"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, AlertCircle } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Create account
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create account");
            }

            // Sign in automatically
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error("Account created but failed to sign in");
            }

            router.push("/boards");
            router.refresh();
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
                    {/* Logo */}
                    <div className="mb-8 flex items-center justify-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">Velora</span>
                    </div>

                    <GlassPanel intensity="medium" className="p-8">
                        <h1 className="mb-2 text-center text-2xl font-bold text-white">
                            Create Account
                        </h1>
                        <p className="mb-8 text-center text-velora-text-muted">
                            Start organizing your creative projects
                        </p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
                            >
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-velora-text-muted">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-velora-text-subtle" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full rounded-lg bg-white/5 py-3 pl-12 pr-4 text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                    />
                                </div>
                            </div>

                            {/* Email */}
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

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-velora-text-muted">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-velora-text-subtle" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full rounded-lg bg-white/5 py-3 pl-12 pr-4 text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-velora-text-subtle">
                                    Must be at least 6 characters
                                </p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-velora-cyan/25 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>

                        {/* Sign in link */}
                        <p className="mt-6 text-center text-sm text-velora-text-muted">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="font-medium text-velora-cyan transition-colors hover:text-velora-pink"
                            >
                                Sign in
                            </Link>
                        </p>
                    </GlassPanel>
                </motion.div>
            </div>
        </GlassLayout>
    );
}
