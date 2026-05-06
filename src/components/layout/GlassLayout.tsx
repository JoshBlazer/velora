"use client";

import { cn } from "@/lib/cn";

interface GlassLayoutProps {
    children: React.ReactNode;
    className?: string;
    background?: string;
}

export function GlassLayout({ children, className, background }: GlassLayoutProps) {
    return (
        <div
            className={cn(
                "relative min-h-screen w-full overflow-hidden",
                !background && "bg-velora-dark",
                className
            )}
            style={background ? { background } : undefined}
        >
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-velora-cyan focus:px-4 focus:py-2 focus:text-white focus:outline-none"
            >
                Skip to content
            </a>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
                    style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
                />
                <div
                    className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-25 blur-[100px]"
                    style={{ background: "radial-gradient(circle, #f472b6 0%, transparent 70%)" }}
                />
                <div
                    className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full opacity-15 blur-[80px]"
                    style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
                />
            </div>
            <div id="main-content" className="relative z-10">{children}</div>
        </div>
    );
}

export default GlassLayout;
