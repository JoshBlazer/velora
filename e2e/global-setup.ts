import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const BOARDS_EMAIL = "boards-e2e@velora-e2e.test";
export const BOARDS_PASSWORD = "e2epassword123";

// A second account, used to prove one user cannot reach another's board.
export const OUTSIDER_EMAIL = "outsider-e2e@velora-e2e.test";
export const OUTSIDER_PASSWORD = "e2epassword123";

// Login refuses unverified addresses, so seeded accounts carry a
// verification timestamp. auth.spec still covers the real signup path.
export const UNVERIFIED_EMAIL = "unverified-e2e@velora-e2e.test";
export const UNVERIFIED_PASSWORD = "e2epassword123";

/**
 * Seeds the accounts the specs log in with, straight into the database.
 *
 * Driving the signup UI for this tripped the rate limiter: signup allows 5
 * requests per hour per IP, every CI request comes from one IP, and a
 * beforeAll signup re-runs each time a test in its describe block retries.
 * Past the limit the account was never created and every later login sat on
 * /login. Seeding here keeps signup itself covered by auth.spec, which signs
 * up once and stays well inside the limit.
 */
export default async function globalSetup() {
    const prisma = new PrismaClient();

    try {
        const password = await bcrypt.hash(BOARDS_PASSWORD, 12);
        const verified = new Date();

        for (const [name, email] of [
            ["Boards E2E", BOARDS_EMAIL],
            ["Outsider E2E", OUTSIDER_EMAIL],
        ]) {
            await prisma.user.upsert({
                where: { email },
                update: { password, emailVerified: verified },
                create: { name, email, password, emailVerified: verified },
            });
        }

        // Deliberately left unverified, to assert login refuses it.
        await prisma.user.upsert({
            where: { email: UNVERIFIED_EMAIL },
            update: { password, emailVerified: null },
            create: { name: "Unverified E2E", email: UNVERIFIED_EMAIL, password },
        });
    } finally {
        await prisma.$disconnect();
    }
}
