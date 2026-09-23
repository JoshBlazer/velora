import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const BOARDS_EMAIL = "boards-e2e@velora-e2e.test";
export const BOARDS_PASSWORD = "e2epassword123";

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

        await prisma.user.upsert({
            where: { email: BOARDS_EMAIL },
            update: { password },
            create: { name: "Boards E2E", email: BOARDS_EMAIL, password },
        });
    } finally {
        await prisma.$disconnect();
    }
}
