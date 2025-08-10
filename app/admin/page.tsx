import { redirect } from "next/navigation"

/**
 * The default admin page redirects to the overview section.  We do not
 * render any content here because each management area lives in its own
 * route under `/admin`.  Using a server component allows the redirect
 * to occur before the client side loads.
 */
export default function AdminIndexPage() {
  redirect("/admin/overview")
}