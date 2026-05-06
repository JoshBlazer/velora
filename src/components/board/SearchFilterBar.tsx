"use client";

import { Search, X, Clock } from "lucide-react";
import { Label } from "@/lib/types";
import { Priority } from "@prisma/client";

interface SearchFilterBarProps {
    query: string;
    onQueryChange: (q: string) => void;
    priority: Priority | null;
    onPriorityChange: (p: Priority | null) => void;
    activeLabelId: string | null;
    onLabelChange: (id: string | null) => void;
    overdueOnly: boolean;
    onOverdueChange: (v: boolean) => void;
    boardLabels: Label[];
    matchCount: number;
    totalCount: number;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
    { value: "HIGH", label: "High", color: "text-red-400 bg-red-500/10 hover:bg-red-500/20" },
    { value: "MEDIUM", label: "Med", color: "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20" },
    { value: "LOW", label: "Low", color: "text-green-400 bg-green-500/10 hover:bg-green-500/20" },
];

export function SearchFilterBar({
    query,
    onQueryChange,
    priority,
    onPriorityChange,
    activeLabelId,
    onLabelChange,
    overdueOnly,
    onOverdueChange,
    boardLabels,
    matchCount,
    totalCount,
}: SearchFilterBarProps) {
    const isFiltered = query || priority || activeLabelId || overdueOnly;

    const clearAll = () => {
        onQueryChange("");
        onPriorityChange(null);
        onLabelChange(null);
        onOverdueChange(false);
    };

    return (
        <div className="mb-6 flex flex-wrap items-center gap-3" role="search" aria-label="Filter tasks">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-velora-text-subtle" aria-hidden="true" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search tasks..."
                    aria-label="Search tasks"
                    className="w-full rounded-lg bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-velora-text-subtle outline-none ring-1 ring-white/10 transition-all focus:ring-velora-cyan/50"
                />
            </div>

            {/* Priority filters */}
            <div className="flex gap-1.5" role="group" aria-label="Filter by priority">
                {PRIORITIES.map((p) => (
                    <button
                        key={p.value}
                        onClick={() => onPriorityChange(priority === p.value ? null : p.value)}
                        aria-pressed={priority === p.value}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${p.color} ${priority === p.value ? "ring-1 ring-white/30" : ""}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Label filters */}
            {boardLabels.length > 0 && (
                <div className="flex gap-1.5" role="group" aria-label="Filter by label">
                    {boardLabels.map((label) => (
                        <button
                            key={label.id}
                            onClick={() => onLabelChange(activeLabelId === label.id ? null : label.id)}
                            aria-pressed={activeLabelId === label.id}
                            aria-label={`Filter by label: ${label.name}`}
                            title={label.name}
                            className={`h-5 w-5 rounded-full transition-all ${activeLabelId === label.id ? "ring-2 ring-white ring-offset-1 ring-offset-transparent" : "hover:scale-110"}`}
                            style={{ background: label.color }}
                        />
                    ))}
                </div>
            )}

            {/* Overdue toggle */}
            <button
                onClick={() => onOverdueChange(!overdueOnly)}
                aria-pressed={overdueOnly}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${overdueOnly ? "bg-red-500/20 text-red-400 ring-1 ring-white/30" : "bg-white/5 text-velora-text-muted hover:bg-white/10 hover:text-white"}`}
            >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Overdue
            </button>

            {/* Match count + clear */}
            {isFiltered && (
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-xs text-velora-text-subtle" aria-live="polite" aria-atomic="true">
                        {matchCount} of {totalCount} tasks
                    </span>
                    <button
                        onClick={clearAll}
                        aria-label="Clear all filters"
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-velora-text-muted transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}
