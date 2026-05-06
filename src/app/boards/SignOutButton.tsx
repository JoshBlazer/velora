"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
        >
            <LogOut className="h-4 w-4" />
            Sign Out
        </button>
    );
}
