import { GlassLayout } from "@/components/layout/GlassLayout";

function SkeletonBox({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-white/10 ${className ?? ""}`} />;
}

export default function BoardLoading() {
    return (
        <GlassLayout>
            <div className="min-h-screen p-6">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <SkeletonBox className="h-5 w-16" />
                        <SkeletonBox className="h-10 w-10 rounded-xl" />
                    </div>
                    <SkeletonBox className="h-12 w-52 rounded-xl" />
                    <div className="flex items-center gap-3">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-10 w-10 rounded-full" />
                        <SkeletonBox className="h-9 w-9" />
                        <SkeletonBox className="h-9 w-9" />
                    </div>
                </header>

                <div className="flex gap-6 overflow-x-hidden">
                    {[3, 2, 1].map((taskCount, i) => (
                        <div
                            key={i}
                            className="min-w-[300px] flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                            <div className="mb-4 flex animate-pulse items-center justify-between">
                                <SkeletonBox className="h-5 w-28" />
                                <SkeletonBox className="h-5 w-7 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: taskCount }).map((_, j) => (
                                    <SkeletonBox key={j} className="h-16 w-full" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassLayout>
    );
}
