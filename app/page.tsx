// Redirect the root URL to the product page.
//
// The original landing page has been removed in favour of the
// dedicated `/product` overview.  When a user visits the root
// of the application they will be immediately redirected to
// `/product` using Next.js's app router `redirect` helper.

import { redirect } from 'next/navigation';

export default function RootPage() {
  // Perform a client/server redirect to the product overview.  This
  // component does not render any UI because the redirect is
  // immediate.
  redirect('/product');
  return null;
}