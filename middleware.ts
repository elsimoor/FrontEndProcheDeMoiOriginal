import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./app/actions";

export async function middleware(request: NextRequest) {
    const session = await getSession();
    const { pathname } = request.nextUrl;
    console.log("session", session);
    // Normalize path for case-insensitive comparison
    const lowerPath = pathname.toLowerCase();

    // Determine if the request targets a protected dashboard.  We only
    // protect the dashboard routes for hotels, restaurants, salons and
    // admins.  Public pages (booking, search, etc.) remain accessible
    // without a session.
    const isProtectedDashboard =
        lowerPath.startsWith("/hotel/dashboard") ||
        lowerPath.startsWith("/restaurant/dashboard") ||
        lowerPath.startsWith("/salon/dashboard") ||
        lowerPath.startsWith("/admin");

    // If the user is logged in but marked inactive, attempt to refresh
    // their activation status from the backend.  This allows a user
    // waiting on the pending approval page to immediately access
    // their dashboard once an administrator approves their business
    // without requiring a new login.  We only perform this check
    // once per request when the user has a businessId/businessType.
    if (
        session?.isLoggedIn &&
        session.user &&
        !session.user.isActive &&
        session.businessId &&
        session.businessType
    ) {
        try {
            // Build a simple GraphQL query to fetch the current
            // business's isActive status.  The businessType is used
            // dynamically to select the appropriate field.
            const businessType = String(session.businessType).toLowerCase();
            const businessId = String(session.businessId);
            const queryName = businessType; // hotel, restaurant or salon
            const query = `query { ${queryName}(id: "${businessId}") { isActive } }`;
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/procheDeMoi`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            const json = await res.json();
            const isActive = json?.data?.[queryName]?.isActive;
            if (isActive) {
                session.user.isActive = true;
                await session.save();
            }
        } catch (err) {
            console.error("Failed to refresh user activation status", err);
        }
    }

    // If requesting a protected dashboard and user is not logged in,
    // redirect to login.  We avoid redirect loops by allowing the login
    // page itself to be accessed unauthenticated.
    if (isProtectedDashboard && (!session || !session.isLoggedIn)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If the user is logged in but inactive, send them to the pending approval
    // page for any dashboard route.
    if (
        isProtectedDashboard &&
        session?.isLoggedIn &&
        session.user &&
        !session.user.isActive
    ) {
        return NextResponse.redirect(
            new URL("/pending-approval", request.url)
        );
    }

    // Enforce role-based and business-type-based access:
    if (session?.isLoggedIn) {
        const businessType = session.businessType?.toLowerCase();
        const role = session.user?.role;
        // Admin pages require an admin role.
        if (lowerPath.startsWith("/admin") && role !== "admin") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        // Hotel dashboard requires businessType "hotel"
        if (
            lowerPath.startsWith("/hotel/dashboard") &&
            businessType !== "hotel"
        ) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        // Restaurant dashboard requires businessType "restaurant"
        if (
            lowerPath.startsWith("/restaurant/dashboard") &&
            businessType !== "restaurant"
        ) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        // Salon dashboard requires businessType "salon"
        if (
            lowerPath.startsWith("/salon/dashboard") &&
            businessType !== "salon"
        ) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
};


export const config = {
    // on garde le matcher générique
    matcher: ["/((?!_next/static|_next/image|api/*|favicon.ico).*)"],
};