import { NextResponse } from 'next/server'
import { getSession } from '@/app/actions'

/**
 * API endpoint for switching the currently active business associated
 * with the logged‑in user.  When a manager operates multiple
 * services (hotel, restaurant, salon) they can switch between
 * dashboards using quick icons in the sidebar.  This handler updates
 * the session's `businessType` and `businessId` so that the
 * middleware authorises access to the selected dashboard.  The
 * client should call this endpoint with a JSON body containing
 * `businessType` (lowercase string) and `businessId` (string).
 */
export async function POST(request: Request) {
  try {
    const { businessType, businessId } = await request.json()
    // Validate inputs
    if (!businessType || !businessId) {
      return NextResponse.json({ error: 'Missing businessType or businessId' }, { status: 400 })
    }
    const session = await getSession()
    // Ensure user is authenticated
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    // Switch the current business in the session.
    // If the session already has a businessId/businessType, treat
    // that as the previous service and move it into the services
    // array.  Remove the newly selected business from the services
    // array if present to avoid duplicates.  This ensures the
    // available services list reflects all businesses the user
    // manages except the active one.  Update both the top‑level
    // session and the nested user object for consistency.
    const prevType: string | undefined = session.businessType
    const prevId: string | undefined = session.businessId
    // Normalise session.services to an array.  Preserve any existing
    // isActive flags so that services that were already approved or
    // explicitly set as inactive retain their status.  Each service
    // entry may optionally include an `isActive` property.
    let services: { businessId: string; businessType: string; isActive?: boolean }[] = []
    if (Array.isArray(session.services)) {
      services = [...session.services]
    }
    // Remove the newly selected service from the services list, if it exists.
    services = services.filter((s) => {
      return !(
        s.businessType?.toLowerCase() === String(businessType).toLowerCase() &&
        s.businessId === String(businessId)
      )
    })
    // If there was a previous business, push it into services (if not the same as the new one).
    if (
      prevType &&
      prevId &&
      !(String(prevType).toLowerCase() === String(businessType).toLowerCase() && prevId === String(businessId))
    ) {
      // Avoid duplicates if it already exists in services
      const exists = services.some(
        (s) => s.businessType?.toLowerCase() === String(prevType).toLowerCase() && s.businessId === String(prevId)
      )
      if (!exists) {
        // Mark the previous service as active because it was the one the user
        // just switched away from.  This ensures the UI enables the
        // corresponding dashboard switcher without having to query the
        // backend.
        services.push({ businessType: prevType, businessId: prevId, isActive: true })
      }
    }
    // Assign updated services list back to the session
    session.services = services
    // Update the primary business fields
    session.businessType = businessType
    session.businessId = businessId
    if (session.user) {
      ;(session.user as any).businessType = businessType
      ;(session.user as any).businessId = businessId
      // Also update services on the user object if present for client use.
      // Preserve the isActive flags on services so the frontend can
      // directly render switch icons without additional queries.
      ;(session.user as any).services = services
    }
    await session.save()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error in switch-service API', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}