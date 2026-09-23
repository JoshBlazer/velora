import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
    default: { board: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

const { getBoardAccess, canRead, canWrite } = await import("@/lib/board-access");

beforeEach(() => {
    findUnique.mockReset();
});

describe("canRead / canWrite", () => {
    it("lets owners and editors write", () => {
        expect(canWrite("owner")).toBe(true);
        expect(canWrite("editor")).toBe(true);
    });

    it("does not let viewers write", () => {
        expect(canWrite("viewer")).toBe(false);
    });

    it("does not let non-members write", () => {
        expect(canWrite(null)).toBe(false);
    });

    it("lets any member read", () => {
        expect(canRead("owner")).toBe(true);
        expect(canRead("editor")).toBe(true);
        expect(canRead("viewer")).toBe(true);
    });

    it("does not let non-members read", () => {
        expect(canRead(null)).toBe(false);
    });
});

describe("getBoardAccess", () => {
    it("returns null for a board that does not exist", async () => {
        findUnique.mockResolvedValue(null);
        expect(await getBoardAccess("missing", "user-1")).toBeNull();
    });

    it("returns owner for the board's creator", async () => {
        findUnique.mockResolvedValue({ userId: "user-1", members: [] });
        expect(await getBoardAccess("board-1", "user-1")).toBe("owner");
    });

    // The IDOR case: a real user asking for someone else's board.
    it("returns null for a signed-in stranger", async () => {
        findUnique.mockResolvedValue({ userId: "someone-else", members: [] });
        expect(await getBoardAccess("board-1", "user-1")).toBeNull();
    });

    it("maps each membership role to its access level", async () => {
        for (const [role, expected] of [
            ["OWNER", "owner"],
            ["EDITOR", "editor"],
            ["VIEWER", "viewer"],
        ] as const) {
            findUnique.mockResolvedValue({ userId: "someone-else", members: [{ role }] });
            expect(await getBoardAccess("board-1", "user-1")).toBe(expected);
        }
    });

    it("returns null for an unrecognised role rather than guessing", async () => {
        findUnique.mockResolvedValue({ userId: "someone-else", members: [{ role: "NONSENSE" }] });
        expect(await getBoardAccess("board-1", "user-1")).toBeNull();
    });

    it("scopes the membership lookup to the asking user", async () => {
        findUnique.mockResolvedValue({ userId: "someone-else", members: [] });
        await getBoardAccess("board-1", "user-1");

        // If this filter were ever dropped, members[0] would be an arbitrary
        // member and every board would read as shared with everyone.
        expect(findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                select: expect.objectContaining({
                    members: expect.objectContaining({ where: { userId: "user-1" } }),
                }),
            })
        );
    });
});
