/**
 * Marks every existing account as email-verified.
 *
 * Login now requires a verified address. Accounts created before that change
 * have emailVerified = null and would be refused, so run this once against a
 * deployed database before enabling the requirement:
 *
 *   npm run db:verify-existing
 *
 * It only fills in accounts that have no value yet, so it is safe to re-run
 * and it never overwrites a real verification timestamp.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const pending = await prisma.user.count({ where: { emailVerified: null } });

    if (pending === 0) {
        console.log("No accounts need backfilling.");
        return;
    }

    const { count } = await prisma.user.updateMany({
        where: { emailVerified: null },
        data: { emailVerified: new Date() },
    });

    console.log(`Marked ${count} pre-existing account(s) as verified.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
