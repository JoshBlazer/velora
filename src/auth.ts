import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { hasAllowance, recordAttempt, clearAttempts, getClientIp } from "@/lib/rate-limit";

// Signup, forgot-password and reset-password were already rate limited. Login
// was not, which left unlimited password guessing against every account.
//
// Only failures count, and a success clears the counter: the budget exists to
// slow guessing, so signing in correctly should never consume it.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES_PER_IP = 20;
const LOGIN_MAX_FAILURES_PER_EMAIL = 10;

// Enforced unless explicitly disabled. Accounts created before this have
// emailVerified = null and would be locked out, so backfill them first with
// `npm run db:verify-existing`.
const requireVerifiedEmail = process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, request) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Only the throttling key is normalised. The lookup keeps the
                // address as supplied, because existing rows were stored
                // as-entered and lowercasing here would lock those accounts out.
                const emailKey = email.toLowerCase();

                // Throttle by IP and by account. The IP limit slows a single
                // source working through many accounts; the per-email limit
                // slows a distributed attack concentrated on one account.
                const ip = getClientIp(request as unknown as Request);
                const ipKey = `login-fail-ip:${ip}`;
                const accountKey = `login-fail-email:${emailKey}`;

                const [ipAllowed, emailAllowed] = await Promise.all([
                    hasAllowance(ipKey, LOGIN_MAX_FAILURES_PER_IP),
                    hasAllowance(accountKey, LOGIN_MAX_FAILURES_PER_EMAIL),
                ]);

                if (!ipAllowed || !emailAllowed) {
                    console.warn(`[auth] Login blocked by rate limit (ip=${ip})`);
                    return null;
                }

                const recordFailure = async () => {
                    await Promise.all([
                        recordAttempt(ipKey, LOGIN_MAX_FAILURES_PER_IP, LOGIN_WINDOW_MS),
                        recordAttempt(accountKey, LOGIN_MAX_FAILURES_PER_EMAIL, LOGIN_WINDOW_MS),
                    ]);
                };

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    await recordFailure();
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (!isPasswordValid) {
                    await recordFailure();
                    return null;
                }

                // Until this, the verification flow set emailVerified and
                // nothing ever read it, so anyone could sign up with an
                // address they did not control and use it immediately.
                if (requireVerifiedEmail && !user.emailVerified) {
                    console.warn(`[auth] Login blocked for unverified address`);
                    // Not a guess at the password, so it does not count
                    // against the brute-force budget.
                    return null;
                }

                // Correct credentials: give the budget back, so someone who
                // fumbles a password a few times then succeeds is not left
                // one attempt away from being locked out.
                await Promise.all([clearAttempts(ipKey), clearAttempts(accountKey)]);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.picture = user.image;

                const record = await prisma.user.findUnique({
                    where: { id: user.id as string },
                    select: { passwordChangedAt: true },
                });
                token.pwdAt = record?.passwordChangedAt?.getTime() ?? 0;

                return token;
            }

            if (trigger === "update" && session) {
                token.name = session.name ?? token.name;
                token.picture = session.image ?? token.picture;
            }

            // Sessions are stateless, so a password change cannot expire them
            // on its own. Refusing tokens issued before the current
            // passwordChangedAt is what makes "change your password" actually
            // remove access from anyone else holding a session.
            if (token.id) {
                const record = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { passwordChangedAt: true },
                });

                // The account is gone.
                if (!record) return null;

                const changedAt = record.passwordChangedAt?.getTime() ?? 0;
                if (changedAt > ((token.pwdAt as number) ?? 0)) return null;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name ?? null;
                session.user.image = (token.picture as string | null | undefined) ?? null;
            }
            return session;
        },
    },
});
