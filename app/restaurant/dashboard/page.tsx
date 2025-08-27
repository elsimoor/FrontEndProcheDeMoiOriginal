// Redirect the top-level restaurant dashboard route to the overview page.
//
// The restaurant dashboard previously contained a full analytics
// implementation similar to the hotel dashboard.  However, to
// consolidate logic and avoid duplicate code, the actual dashboard
// content now lives under `/restaurant/dashboard/overview`.  This
// file simply issues a redirect to the overview page so that
// visiting `/restaurant/dashboard` takes the user directly to the
// correct location.

import { redirect } from 'next/navigation'

// Because this page runs on the server during navigation, we do not
// need to mark it as a client component.  When Next.js renders
// this route it will immediately perform the redirect without
// rendering any UI.
export default function RestaurantDashboardPage() {
  // Issue a redirect to the overview page.  Using the relative path
  // ensures that the application is served from the correct base URL.
  redirect('/restaurant/dashboard/overview')
}