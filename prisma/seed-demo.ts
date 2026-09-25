/**
 * Seeds a signed-in-able demo account with a populated board.
 *
 * Intended for a public demo deployment, where REQUIRE_EMAIL_VERIFICATION is
 * "false" and there is no mail provider: visitors need an account that already
 * exists and a board that already has something in it.
 *
 *   DEMO_EMAIL=demo@example.com DEMO_PASSWORD=... npm run db:seed-demo
 *
 * Re-running resets the demo board to this exact state, so it can be scheduled
 * to undo whatever visitors have done to it.
 *
 * Never run this against a database holding real accounts.
 */
import { PrismaClient, Priority, BoardRole, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@velora.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "velorademo123";
const TEAMMATE_EMAIL = "devan@velora.app";

const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
    // This creates an account whose password is published, so it must only
    // ever touch a demo database. Demo mode is the signal for that, and the
    // check is what makes it safe to run from the deploy itself -- which in
    // turn is what guarantees the seed and the app agree on which database
    // they mean.
    if (process.env.REQUIRE_EMAIL_VERIFICATION !== "false") {
        console.log(
            "[seed-demo] Skipping: REQUIRE_EMAIL_VERIFICATION is not \"false\", so this " +
            "is not a demo deployment. Set it to \"false\" if you meant to seed a demo."
        );
        return;
    }

    if (!process.env.DEMO_PASSWORD) {
        console.warn(
            "[seed-demo] DEMO_PASSWORD is not set, falling back to the default. " +
            "Set it explicitly for anything reachable from the internet."
        );
    }

    const password = await bcrypt.hash(DEMO_PASSWORD, 12);
    const emailVerified = new Date();

    const demo = await prisma.user.upsert({
        where: { email: DEMO_EMAIL },
        update: { password, emailVerified },
        create: { name: "Demo User", email: DEMO_EMAIL, password, emailVerified },
    });

    const teammate = await prisma.user.upsert({
        where: { email: TEAMMATE_EMAIL },
        update: { emailVerified },
        create: { name: "Devan Reyes", email: TEAMMATE_EMAIL, password, emailVerified },
    });

    // Reset rather than accumulate, so repeated runs restore the same board.
    await prisma.board.deleteMany({ where: { userId: demo.id, title: "Spring Campaign" } });

    const board = await prisma.board.create({
        data: { title: "Spring Campaign", userId: demo.id, background: "aurora" },
    });

    await prisma.boardMember.createMany({
        data: [
            { boardId: board.id, userId: demo.id, role: BoardRole.OWNER },
            { boardId: board.id, userId: teammate.id, role: BoardRole.EDITOR },
        ],
    });

    const labels: { id: string }[] = [];
    for (const l of [
        { name: "Design", color: "#22d3ee" },
        { name: "Copy", color: "#f472b6" },
        { name: "Urgent", color: "#a78bfa" },
    ]) {
        labels.push(await prisma.label.create({ data: { ...l, boardId: board.id } }));
    }

    const columns: { id: string }[] = [];
    for (const [i, title] of ["To Do", "In Progress", "Review", "Done"].entries()) {
        columns.push(await prisma.column.create({ data: { title, order: i, boardId: board.id } }));
    }

    const tasks: [number, string, Priority, number | null, string | null, number[]][] = [
        [0, "Moodboard for hero imagery", Priority.HIGH, 2, teammate.id, [0]],
        [0, "Shortlist typefaces", Priority.MEDIUM, 5, null, [0]],
        [0, "Draft launch email", Priority.LOW, 9, null, [1]],
        [1, "Landing page wireframes", Priority.HIGH, -1, demo.id, [0, 2]],
        [1, "Rewrite pricing copy", Priority.MEDIUM, 3, teammate.id, [1]],
        [2, "Colour contrast audit", Priority.HIGH, 1, demo.id, [0, 2]],
        [3, "Brand palette sign-off", Priority.MEDIUM, -4, demo.id, [0]],
        [3, "Campaign brief approved", Priority.LOW, -6, teammate.id, []],
    ];

    let order = 0;
    for (const [col, content, priority, due, assigneeId, labelIdx] of tasks) {
        const task = await prisma.task.create({
            data: {
                content,
                priority,
                order: order++,
                columnId: columns[col].id,
                dueDate: due === null ? null : inDays(due),
                assigneeId,
                labels: { connect: labelIdx.map((i) => ({ id: labels[i].id })) },
            },
        });

        if (content === "Landing page wireframes") {
            await prisma.comment.create({
                data: {
                    content: "Second pass is up — I widened the hero and dropped the third CTA.",
                    taskId: task.id,
                    userId: teammate.id,
                },
            });
            await prisma.comment.create({
                data: {
                    content: "Much better. Let's review together tomorrow.",
                    taskId: task.id,
                    userId: demo.id,
                },
            });
        }
    }

    const activity: [string, ActivityType, Record<string, string>][] = [
        [teammate.id, ActivityType.MEMBER_ADDED, {}],
        [demo.id, ActivityType.TASK_CREATED, { content: "Colour contrast audit" }],
        [teammate.id, ActivityType.TASK_MOVED, { content: "Rewrite pricing copy" }],
        [teammate.id, ActivityType.COMMENT_ADDED, { content: "Landing page wireframes" }],
        [demo.id, ActivityType.TASK_ASSIGNED, { content: "Moodboard for hero imagery" }],
    ];

    for (const [userId, type, meta] of activity) {
        await prisma.activity.create({ data: { boardId: board.id, userId, type, meta } });
    }

    console.log(`Demo board ready. Sign in as ${DEMO_EMAIL}`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
