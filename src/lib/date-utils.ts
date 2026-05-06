export function formatDueDate(date: Date | string | null): string | null {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isOverdue(date: Date | string | null): boolean {
    if (!date) return false;
    const d = typeof date === "string" ? new Date(date) : date;
    return d < new Date();
}

export function toDateInputValue(date: Date | string | null): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
}
