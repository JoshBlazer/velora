/**
 * Fixed-window rate limiting.
 *
 * On serverless the in-memory store below is close to useless: each instance
 * keeps its own Map, instances come and go, and a caller spread across a few
 * warm instances effectively gets the limit multiplied by that many. So when
 * Upstash credentials are present the counter lives in Redis and is shared by
 * every instance; the Map is the local-development fallback.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable Redis.
 * Without them in production the limiter logs once that it is per-instance
 * only, rather than quietly pretending to work.
 */

interface Entry {
    count: number;
    resetAt: number;
}

const store = new Map<string, Entry>();
const MAX_ENTRIES = 10_000;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

let warnedAboutMemoryStore = false;

function warnIfUnsharedInProduction() {
    if (useRedis || warnedAboutMemoryStore) return;
    warnedAboutMemoryStore = true;
    if (process.env.NODE_ENV === "production") {
        console.warn(
            "[rate-limit] No UPSTASH_REDIS_REST_URL/TOKEN set. Falling back to an " +
            "in-memory counter, which is per-instance and resets on cold start. " +
            "Limits will not hold across a serverless deployment."
        );
    }
}

function evict() {
    if (store.size < MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key);
        if (store.size < MAX_ENTRIES * 0.9) break;
    }
}

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
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

async function redisCommand(command: (string | number)[]): Promise<unknown> {
    const res = await fetch(REDIS_URL!, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${REDIS_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
    });

    if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
    return (await res.json())?.result;
}

async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const count = Number(await redisCommand(["INCR", key]));

    // Only the request that creates the key sets its expiry, so the window is
    // anchored to the first request instead of sliding forward on every hit.
    if (count === 1) {
        await redisCommand(["PEXPIRE", key, windowMs]);
    }

    return count <= limit;
}

/**
 * Returns true when the request is allowed, false once it has exhausted its
 * allowance for the current window.
 *
 * Fails open: if Redis is unreachable the request is permitted rather than
 * taking the whole auth surface down with the rate limiter.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    warnIfUnsharedInProduction();

    if (!useRedis) return memoryRateLimit(key, limit, windowMs);

    try {
        return await redisRateLimit(key, limit, windowMs);
    } catch (error) {
        console.error("[rate-limit] Redis unavailable, allowing request:", error);
        return true;
    }
}

export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        "unknown"
    );
}
