import { GlassLayout } from "@/components/layout/GlassLayout";

function SkeletonBox({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-white/10 ${className ?? ""}`} />;
}

export default function BoardsLoading() {
    return (
        <GlassLayout>
            <div className="min-h-screen p-6">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SkeletonBox className="h-10 w-10 rounded-xl" />
                        <SkeletonBox className="h-6 w-20" />
                    </div>
                    <div className="flex items-center gap-4">
                        <SkeletonBox className="h-4 w-32" />
                        <SkeletonBox className="h-9 w-24" />
                    </div>
                </header>

                <div className="mb-8">
                    <SkeletonBox className="mb-2 h-9 w-48" />
                    <SkeletonBox className="h-4 w-56" />
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                        />
                    ))}
                </div>
            </div>
        </GlassLayout>
    );
}
