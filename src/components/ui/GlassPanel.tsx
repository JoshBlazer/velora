"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

export interface GlassPanelProps extends Omit<HTMLMotionProps<"div">, "ref"> {
    /** Glass effect intensity - controls blur and opacity */
    intensity?: "light" | "medium" | "heavy";
    /** Whether to include hover effects */
    hoverable?: boolean;
    /** Additional className overrides */
    className?: string;
    children?: React.ReactNode;
    /** Animation variants for framer-motion */
    variants?: Variants;
}

const intensityStyles = {
    light: "bg-white/5 backdrop-blur-md border-white/10",
    medium: "bg-white/10 backdrop-blur-lg border-white/15",
    heavy: "bg-white/15 backdrop-blur-xl border-white/20",
} as const;

/**
 * GlassPanel - A reusable glassmorphism container component
 * 
 * Core styling: bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl rounded-xl
 * Used throughout Velora for cards, panels, and floating elements
 */
export function GlassPanel({
    intensity = "medium",
    hoverable = false,
    className,
    children,
    ...motionProps
}: GlassPanelProps) {
    return (
        <motion.div
            className={cn(
                // Base glass effect
                "rounded-xl border shadow-xl",
                // Intensity-based styles
                intensityStyles[intensity],
                // Subtle inner glow
                "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
                // Hover effects
                hoverable && [
                    "transition-all duration-300",
                    "hover:bg-white/15 hover:border-white/25",
                    "hover:shadow-2xl hover:scale-[1.02]",
                ],
                className
            )}
            {...motionProps}
        >
            {children}
        </motion.div>
    );
}

export default GlassPanel;
