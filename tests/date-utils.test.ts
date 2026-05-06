import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatDueDate, isOverdue, toDateInputValue } from "@/lib/date-utils";

describe("formatDueDate", () => {
    it("returns null for null input", () => {
        expect(formatDueDate(null)).toBeNull();
    });

    it("returns null for empty string", () => {
        expect(formatDueDate("")).toBeNull();
    });

    it("returns null for invalid date string", () => {
        expect(formatDueDate("not-a-date")).toBeNull();
    });

    it("formats a Date object", () => {
        const date = new Date(2025, 0, 15); // Jan 15 2025
        expect(formatDueDate(date)).toBe("Jan 15");
    });

    it("formats a valid ISO string", () => {
        expect(formatDueDate("2025-06-20T00:00:00.000Z")).toMatch(/Jun 2[09]/);
    });

    it("handles single-digit day", () => {
        const date = new Date(2025, 2, 5); // Mar 5 2025
        expect(formatDueDate(date)).toBe("Mar 5");
    });
});

describe("isOverdue", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns false for null", () => {
        expect(isOverdue(null)).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(isOverdue("")).toBe(false);
    });

    it("returns true for a past date", () => {
        expect(isOverdue("2025-06-01T00:00:00Z")).toBe(true);
    });

    it("returns false for a future date", () => {
        expect(isOverdue("2025-07-01T00:00:00Z")).toBe(false);
    });

    it("returns true for a past Date object", () => {
        expect(isOverdue(new Date("2025-01-01"))).toBe(true);
    });

    it("returns false for a future Date object", () => {
        expect(isOverdue(new Date("2026-01-01"))).toBe(false);
    });
});

describe("toDateInputValue", () => {
    it("returns empty string for null", () => {
        expect(toDateInputValue(null)).toBe("");
    });

    it("returns empty string for empty string", () => {
        expect(toDateInputValue("")).toBe("");
    });

    it("returns empty string for invalid date", () => {
        expect(toDateInputValue("garbage")).toBe("");
    });

    it("formats a Date object as YYYY-MM-DD", () => {
        const date = new Date("2025-03-20T00:00:00.000Z");
        expect(toDateInputValue(date)).toBe("2025-03-20");
    });

    it("formats an ISO string as YYYY-MM-DD", () => {
        expect(toDateInputValue("2025-11-05T08:30:00Z")).toBe("2025-11-05");
    });
});
