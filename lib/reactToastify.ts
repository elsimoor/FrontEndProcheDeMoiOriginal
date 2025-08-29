// This file acts as a lightweight shim around our existing toast
// implementation so that pages can import `toast` and `ToastContainer`
// in a manner similar to the popular `react-toastify` package.  We
// internally leverage the custom `use-toast` hook to show notifications
// but expose a simpler API surface that accepts strings or option
// objects.  The `ToastContainer` component is provided for parity
// with the real library; it returns null because our toast provider
// already mounts itself at the top level of the app via the
// `Toaster` component in `components/ui/toaster.tsx`.

import { toast as internalToast } from "@/hooks/use-toast"

/**
 * Shows a toast.  Accepts either a string (used as the title) or an
 * object containing toast options.  Additional options such as
 * `description`, `duration` and `variant` will be passed through to
 * the internal toast implementation.  If a string is provided, it is
 * used as the title and any options override defaults.
 */
function toast(message: string | { title?: string; description?: string; duration?: number; variant?: string }, options?: { description?: string; duration?: number; variant?: string }) {
  // Normalize arguments into a single options object
  let opts: any = {}
  if (typeof message === 'string') {
    opts = { title: message, ...(options || {}) }
  } else {
    opts = { ...message }
  }
  // Invoke the internal toast with the merged options
  internalToast(opts)
}

/**
 * Info toast.  Simply forwards to the base toast method.  The info
 * variant is rendered the same as the default variant.
 */
toast.info = function (message: string | { title?: string; description?: string; duration?: number }, options?: { description?: string; duration?: number }) {
  toast(message, options)
}

/**
 * Success toast.  Rendered as a default variant.  Accepts a string or
 * options object.
 */
toast.success = function (message: string | { title?: string; description?: string; duration?: number }, options?: { description?: string; duration?: number }) {
  toast(message, options)
}

/**
 * Error toast.  Applies the `destructive` variant to give a red
 * appearance consistent with error messaging.  Accepts a string or
 * options object.  If an options object is provided, the variant can
 * be overridden but will default to destructive.
 */
toast.error = function (message: string | { title?: string; description?: string; duration?: number; variant?: string }, options?: { description?: string; duration?: number; variant?: string }) {
  if (typeof message === 'string') {
    toast(message, { variant: 'destructive', ...(options || {}) })
  } else {
    const { variant, ...rest } = message
    toast({ variant: variant || 'destructive', ...rest, ...(options || {}) })
  }
}

/**
 * Placeholder ToastContainer component.  In the real `react-toastify`
 * library this component mounts a container for toasts.  In our
 * implementation toasts are globally rendered via the `Toaster`
 * component, so this returns null.
 */
export function ToastContainer() {
  return null
}

export { toast }