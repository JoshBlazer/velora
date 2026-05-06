import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, CheckCircle, XCircle } from "lucide-react";

export const metadata: Metadata = {
    title: "Verify Email",
    description: "Confirm your Velora email address.",
};
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import prisma from "@/lib/prisma";

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    let success = false;

    if (token) {
        const record = await prisma.verificationToken.findUnique({ where: { token } });

        if (
            record &&
            record.identifier.startsWith("verify:") &&
            record.expires > new Date()
        ) {
            const email = record.identifier.replace("verify:", "");
            try {
                await prisma.$transaction([
                    prisma.user.update({
                        where: { email },
                        data: { emailVerified: new Date() },
                    }),
                    prisma.verificationToken.delete({ where: { token } }),
                ]);
                success = true;
            } catch {
                // user not found or already verified — treat as failure
            }
        }
    }

    return (
        <GlassLayout>
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex items-center justify-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">Velora</span>
                    </div>

                    <GlassPanel intensity="medium" className="p-8 text-center">
                        {success ? (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <CheckCircle className="h-12 w-12 text-velora-cyan" />
                                </div>
                                <h1 className="mb-2 text-xl font-bold text-white">
                                    Email verified
                                </h1>
                                <p className="mb-6 text-sm text-velora-text-muted">
                                    Your email address has been confirmed. You&apos;re all set.
                                </p>
                                <Link
                                    href="/boards"
                                    className="inline-block rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-velora-cyan/25"
                                >
                                    Go to my boards
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <XCircle className="h-12 w-12 text-red-400" />
                                </div>
                                <h1 className="mb-2 text-xl font-bold text-white">
                                    Link expired or invalid
                                </h1>
                                <p className="mb-6 text-sm text-velora-text-muted">
                                    This verification link is no longer valid. Sign in and
                                    we&apos;ll send you a new one.
                                </p>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-velora-cyan transition-colors hover:text-velora-pink"
                                >
                                    Back to sign in
                                </Link>
                            </>
                        )}
                    </GlassPanel>
                </div>
            </div>
        </GlassLayout>
    );
}
