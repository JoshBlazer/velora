import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Protected routes
    const protectedPaths = ["/boards", "/board"];
    const isProtectedRoute = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    // Auth pages (redirect if already logged in)
    const authPaths = ["/login", "/signup"];
    const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/boards", req.nextUrl.origin));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all paths except static files and API routes
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
