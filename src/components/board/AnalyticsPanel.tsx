"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart2, AlertCircle, CheckCircle2, Users, TrendingUp } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface AnalyticsData {
    totalTasks: number;
    overdueTasks: number;
    completedTasks: number;
    completionRate: number;
    memberCount: number;
    byPriority: { LOW: number; MEDIUM: number; HIGH: number };
    byColumn: { title: string; count: number }[];
    activityLast7Days: { date: string; count: number }[];
}

interface AnalyticsPanelProps {
    boardId: string;
    isOpen: boolean;
    onClose: () => void;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="h-2 w-full rounded-full bg-white/10">
            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

function SparkLine({ data }: { data: { date: string; count: number }[] }) {
    const max = Math.max(...data.map((d) => d.count), 1);
    return (
        <div className="flex items-end gap-1 h-12">
            {data.map((d) => {
                const h = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2);
                const label = new Date(d.date).toLocaleDateString("en-US", { weekday: "short" });
                return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                        <div
                            className="w-full rounded-sm"
                            style={{
                                height: `${h}%`,
                                minHeight: 2,
                                background: d.count > 0 ? "linear-gradient(to top, #22d3ee, #f472b6)" : "rgba(255,255,255,0.1)",
                            }}
                            title={`${label}: ${d.count}`}
                        />
                        <span className="text-[9px] text-velora-text-subtle">{label[0]}</span>
                    </div>
                );
            })}
        </div>
    );
}

export function AnalyticsPanel({ boardId, isOpen, onClose }: AnalyticsPanelProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        fetch(`/api/boards/${boardId}/analytics`)
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setIsLoading(false));
    }, [isOpen, boardId]);

    const maxColCount = data ? Math.max(...data.byColumn.map((c) => c.count), 1) : 1;
    const priorityMax = data ? Math.max(data.byPriority.LOW, data.byPriority.MEDIUM, data.byPriority.HIGH, 1) : 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, x: 320 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 320 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-80 p-4"
                    >
                        <GlassPanel intensity="heavy" className="flex h-full flex-col p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="h-4 w-4 text-velora-cyan" />
                                    <span className="font-semibold text-white">Analytics</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded p-1 text-velora-text-subtle hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-5">
                                {isLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-velora-cyan border-t-transparent" />
                                    </div>
                                )}

                                {data && (
                                    <>
                                        {/* Overview */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-white/5 p-3">
                                                <p className="text-2xl font-bold text-white">{data.totalTasks}</p>
                                                <p className="text-xs text-velora-text-subtle">Total tasks</p>
                                            </div>
                                            <div className={`rounded-xl p-3 ${data.overdueTasks > 0 ? "bg-red-500/10" : "bg-white/5"}`}>
                                                <div className="flex items-center gap-1">
                                                    {data.overdueTasks > 0 && <AlertCircle className="h-4 w-4 text-red-400" />}
                                                    <p className={`text-2xl font-bold ${data.overdueTasks > 0 ? "text-red-400" : "text-white"}`}>
                                                        {data.overdueTasks}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-velora-text-subtle">Overdue</p>
                                            </div>
                                            <div className="rounded-xl bg-white/5 p-3">
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                    <p className="text-2xl font-bold text-white">{data.completionRate}%</p>
                                                </div>
                                                <p className="text-xs text-velora-text-subtle">Done rate</p>
                                            </div>
                                            <div className="rounded-xl bg-white/5 p-3">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-velora-cyan" />
                                                    <p className="text-2xl font-bold text-white">{data.memberCount}</p>
                                                </div>
                                                <p className="text-xs text-velora-text-subtle">Members</p>
                                            </div>
                                        </div>

                                        {/* Tasks by priority */}
                                        <div>
                                            <p className="mb-2.5 text-xs font-medium text-velora-text-subtle">By Priority</p>
                                            <div className="space-y-2">
                                                {[
                                                    { label: "LOW", color: "#22d3ee", count: data.byPriority.LOW },
                                                    { label: "MEDIUM", color: "#f472b6", count: data.byPriority.MEDIUM },
                                                    { label: "HIGH", color: "#a78bfa", count: data.byPriority.HIGH },
                                                ].map(({ label, color, count }) => (
                                                    <div key={label}>
                                                        <div className="mb-1 flex justify-between text-xs">
                                                            <span className="text-velora-text-muted">{label}</span>
                                                            <span className="text-white">{count}</span>
                                                        </div>
                                                        <MiniBar value={count} max={priorityMax} color={color} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tasks by column */}
                                        <div>
                                            <p className="mb-2.5 text-xs font-medium text-velora-text-subtle">By Column</p>
                                            <div className="space-y-2">
                                                {data.byColumn.map((col) => (
                                                    <div key={col.title}>
                                                        <div className="mb-1 flex justify-between text-xs">
                                                            <span className="truncate text-velora-text-muted">{col.title}</span>
                                                            <span className="ml-2 flex-shrink-0 text-white">{col.count}</span>
                                                        </div>
                                                        <MiniBar value={col.count} max={maxColCount} color="rgba(255,255,255,0.3)" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 7-day activity */}
                                        <div>
                                            <div className="mb-2.5 flex items-center gap-1.5">
                                                <TrendingUp className="h-3.5 w-3.5 text-velora-text-subtle" />
                                                <p className="text-xs font-medium text-velora-text-subtle">Activity (7 days)</p>
                                            </div>
                                            <SparkLine data={data.activityLast7Days} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </GlassPanel>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
