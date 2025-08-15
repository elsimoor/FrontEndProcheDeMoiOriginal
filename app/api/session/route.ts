import { NextResponse } from "next/server";
import { getSession } from "@/app/actions";

/**
 * API endpoint for retrieving the current user's session.  This endpoint
 * exposes a minimal representation of the session suitable for use in
 * client‑side components.  Because `iron-session` stores data in an
 * httpOnly cookie, client components cannot access the session directly.
 * Fetching `/api/session` will return the `user`, `businessId` and
 * `businessType` fields if the user is logged in.
 */
export async function GET() {
  const session = await getSession();
  if (!session || !session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }
  return NextResponse.json({
    isLoggedIn: true,
    user: session.user || null,
    // Fall back to user.businessId/businessType if top-level fields are
    // undefined.  This ensures backward compatibility with sessions that
    // may not have these fields copied at login time.
    businessId: session.businessId ?? (session.user as any)?.businessId ?? null,
    businessType: session.businessType ?? (session.user as any)?.businessType ?? null,
    // Expose the auth token so client components can attach it in
    // GraphQL requests.  Without this field the auth link cannot
    // populate the Authorization header on the client.
    token: session.token || null,
  });
}

/**
 * API endpoint for logging out the current user.  This handler destroys
 * the server‑side session by calling the `destroy` method on the
 * iron-session object.  After destroying the session a simple JSON
 * response is returned.  Clients should perform any navigation after
 * calling this endpoint.
 */
export async function DELETE() {
  const session = await getSession();
  // Destroy the session if it exists.  Destroy is idempotent so safe to
  // call even when no session is present.
  if (session) {
    await session.destroy();
  }
  return NextResponse.json({ ok: true });
}