"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, User, Lock, Trash2, Check } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface SettingsClientProps {
    initialName: string;
    initialImage: string;
    email: string;
    hasPassword: boolean;
}

function Avatar({ name, image, size = 48 }: { name: string; image: string; size?: number }) {
    const [imgError, setImgError] = useState(false);
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";

    if (image && !imgError) {
        return (
            <img
                src={image}
                alt={name}
                width={size}
                height={size}
                onError={() => setImgError(true)}
                className="rounded-full object-cover"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className="flex items-center justify-center rounded-full bg-gradient-to-br from-velora-cyan to-velora-pink font-semibold text-white"
            style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
            {initials}
        </div>
    );
}

export function SettingsClient({ initialName, initialImage, email, hasPassword }: SettingsClientProps) {
    const router = useRouter();
    const { update } = useSession();

    const [name, setName] = useState(initialName);
    const [image, setImage] = useState(initialImage);
    const [profileLoading, setProfileLoading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const res = await fetch("/api/user", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), image: image.trim() || null }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }
            await update({ name: name.trim(), image: image.trim() || null });
            toast.success("Profile updated");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await fetch("/api/user/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to change password");
            }
            toast.success("Password changed");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== "DELETE") return;
        setDeleteLoading(true);
        try {
            const res = await fetch("/api/user", { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete account");
            await signOut({ callbackUrl: "/" });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong");
            setDeleteLoading(false);
        }
    };

    return (
        <GlassLayout>
            <div className="min-h-screen p-6">
                <header className="mb-8 flex items-center gap-4">
                    <Link
                        href="/boards"
                        className="flex items-center gap-2 rounded-lg p-2 text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Settings</span>
                    </div>
                </header>

                <div className="mx-auto max-w-2xl space-y-6">

                    {/* Profile */}
                    <GlassPanel intensity="medium" className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            <User className="h-5 w-5 text-velora-cyan" />
                            <h2 className="text-lg font-semibold text-white">Profile</h2>
                        </div>

                        <div className="mb-6 flex items-center gap-4">
                            <Avatar name={name || email} image={image} size={64} />
                            <div>
                                <p className="font-medium text-white">{name || "—"}</p>
                                <p className="text-sm text-velora-text-muted">{email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-velora-text-muted">
                                    Display name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-velora-text-muted">
                                    Avatar URL
                                </label>
                                <input
                                    type="url"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://example.com/avatar.png"
                                    className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50 placeholder-velora-text-subtle"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={profileLoading}
                                    className="flex items-center gap-2 rounded-lg bg-velora-cyan/20 px-4 py-2 text-sm font-medium text-velora-cyan transition-colors hover:bg-velora-cyan/30 disabled:opacity-50"
                                >
                                    <Check className="h-4 w-4" />
                                    {profileLoading ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </GlassPanel>

                    {/* Password */}
                    {hasPassword && (
                        <GlassPanel intensity="medium" className="p-6">
                            <div className="mb-6 flex items-center gap-3">
                                <Lock className="h-5 w-5 text-velora-cyan" />
                                <h2 className="text-lg font-semibold text-white">Password</h2>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-velora-text-muted">
                                        Current password
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-velora-text-muted">
                                        New password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={8}
                                        required
                                        className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-velora-text-muted">
                                        Confirm new password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="flex items-center gap-2 rounded-lg bg-velora-cyan/20 px-4 py-2 text-sm font-medium text-velora-cyan transition-colors hover:bg-velora-cyan/30 disabled:opacity-50"
                                    >
                                        <Check className="h-4 w-4" />
                                        {passwordLoading ? "Saving..." : "Change Password"}
                                    </button>
                                </div>
                            </form>
                        </GlassPanel>
                    )}

                    {/* Danger zone */}
                    <GlassPanel intensity="medium" className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            <Trash2 className="h-5 w-5 text-red-400" />
                            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
                        </div>

                        {!showDeleteConfirm ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">Delete account</p>
                                    <p className="text-sm text-velora-text-muted">
                                        Permanently removes your account and all boards. This cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="ml-4 shrink-0 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                                >
                                    Delete account
                                </button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <p className="text-sm text-velora-text-muted">
                                    Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm.
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full rounded-lg bg-red-500/5 px-4 py-2.5 text-white outline-none ring-1 ring-red-500/20 transition-all focus:ring-red-500/50"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
                                        className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm text-velora-text-muted hover:bg-white/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirm !== "DELETE" || deleteLoading}
                                        className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-40"
                                    >
                                        {deleteLoading ? "Deleting..." : "Delete forever"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </GlassPanel>

                </div>
            </div>
        </GlassLayout>
    );
}
