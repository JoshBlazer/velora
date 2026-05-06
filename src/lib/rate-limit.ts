interface Entry {
    count: number;
    resetAt: number;
}

const store = new Map<string, Entry>();
const MAX_ENTRIES = 10_000;

function evict() {
    if (store.size < MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key);
        if (store.size < MAX_ENTRIES * 0.9) break;
    }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    evict();
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
}

export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        "unknown"
    );
}
