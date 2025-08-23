import { NextResponse } from 'next/server'
import { getSession } from '@/app/actions'

/**
 * API endpoint to append a new service to the current user’s session without
 * changing the primary business.  When a manager adds a new service (e.g.
 * a salon while already managing a hotel), this endpoint updates the
 * session’s `services` array so that the newly created business appears
 * immediately in the dashboard switcher.  It does not alter
 * `businessType` or `businessId`; those remain tied to the current
 * dashboard until the user explicitly switches via the sidebar.  This
 * endpoint should be called after the `appendUserService` mutation
 * succeeds on the backend.
 */
export async function POST(request: Request) {
  try {
    const { businessType, businessId } = await request.json()
    // Validate input
    if (!businessType || !businessId) {
      return NextResponse.json({ error: 'Missing businessType or businessId' }, { status: 400 })
    }
    const session = await getSession()
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    // Normalize to lowercase for comparison
    const typeLower = String(businessType).toLowerCase()
    const idStr = String(businessId)
    let services: { businessId: string; businessType: string }[] = []
    if (Array.isArray(session.services)) {
      services = [...session.services]
    }
    // Check if this service is already in the list
    const exists = services.some(
      (s) => s.businessType?.toLowerCase() === typeLower && s.businessId === idStr
    )
    if (!exists) {
      // When a user adds a new service it is pending until an admin approves it.
      // Record the service with an isActive flag set to false so the UI
      // can display the icon in a disabled state until approval.
      services.push({ businessType: typeLower, businessId: idStr, isActive: false })
      session.services = services
      if (session.user) {
        ;(session.user as any).services = services
      }
      await session.save()
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error in add-service-session API', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}