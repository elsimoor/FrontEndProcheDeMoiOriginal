import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./app/actions";

export async function middleware(request: NextRequest) {
    const session = await getSession();
    const { pathname } = request.nextUrl;
    console.log("session", session)
    // If user is logged in and user is not active, redirect to pending approval page
    const protectedPaths = [
        "/hotel/dashboard",
        "/salon/dashboard",
        "/restaurant/dashboard",
        "/admin"
    ];
    if (
        protectedPaths.some(path => pathname.startsWith(path)) &&
        session.isLoggedIn &&
        session.user &&
        !session.user.isActive
    ) {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
    }

    // if (pathname.startsWith("/dashboard") && !session.isLoggedIn) {
    //     return NextResponse.redirect(new URL("/signin", request.url));
    // }

    return NextResponse.next();
};


export const config = {
    // on garde le matcher générique
    matcher: ["/((?!_next/static|_next/image|api/*|favicon.ico).*)"],
};