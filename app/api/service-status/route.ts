import { NextResponse } from 'next/server'

/**
 * API endpoint to retrieve the activation status of one or more services.
 * Client components can call this endpoint to determine whether a hotel,
 * restaurant or salon has been approved by an administrator.  The
 * request body must be JSON containing a `services` array.  Each
 * element should have `businessType` and `businessId` fields.  The
 * response contains an array of objects with the same `type` and `id`
 * along with an `isActive` boolean.
 *
 * Example request body:
 * { "services": [ { "businessType": "hotel", "businessId": "abc123" }, { "businessType": "restaurant", "businessId": "def456" } ] }
 */
export async function POST(request: Request) {
  try {
    const { services } = await request.json()
    if (!Array.isArray(services)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const results: { type: string; id: string; isActive: boolean }[] = []
    for (const svc of services) {
      try {
        const type = String(svc?.businessType || svc?.type || '').toLowerCase()
        const id = String(svc?.businessId || svc?.id || '')
        if (!type || !id) continue
        // Build a GraphQL query for this service type.  For example:
        // query { hotel(id: "123") { isActive } }
        const query = `query { ${type}(id: "${id}") { isActive } }`
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/procheDeMoi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        const json = await response.json()
        const isActive = Boolean(json?.data?.[type]?.isActive)
        results.push({ type, id, isActive })
      } catch (err) {
        // On any error, default isActive to false for the service
        // and log the error on the server
        console.error('Error fetching service status', svc, err)
        results.push({ type: String(svc?.businessType || svc?.type || '').toLowerCase(), id: String(svc?.businessId || svc?.id || ''), isActive: false })
      }
    }
    return NextResponse.json({ statuses: results })
  } catch (err) {
    console.error('Error in service-status API', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}