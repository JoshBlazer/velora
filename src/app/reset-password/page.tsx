import Link from "next/link";
import { Sparkles, XCircle } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import prisma from "@/lib/prisma";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    let isValid = false;

    if (token) {
        const record = await prisma.verificationToken.findUnique({ where: { token } });
        isValid =
            !!record &&
            record.identifier.startsWith("reset:") &&
            record.expires > new Date();
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

                    <GlassPanel intensity="medium" className="p-8">
                        {isValid ? (
                            <ResetPasswordForm token={token!} />
                        ) : (
                            <div className="text-center">
                                <div className="mb-4 flex justify-center">
                                    <XCircle className="h-12 w-12 text-red-400" />
                                </div>
                                <h1 className="mb-2 text-xl font-bold text-white">
                                    Link expired or invalid
                                </h1>
                                <p className="mb-6 text-sm text-velora-text-muted">
                                    This reset link is no longer valid. Request a new one and
                                    use it within 1 hour.
                                </p>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-velora-cyan transition-colors hover:text-velora-pink"
                                >
                                    Request new link
                                </Link>
                            </div>
                        )}
                    </GlassPanel>
                </div>
            </div>
        </GlassLayout>
    );
}
