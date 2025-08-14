"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Cancellation page shown when a user aborts the payment on Stripe
 * or the checkout fails.  We inform the user that the payment was
 * cancelled and provide navigation to return to the previous page or
 * home.  The associated reservation remains in pending status in the
 * backend.
 */

export default function PaymentCancelPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
      <p className="mb-8 text-gray-700">Your payment was cancelled or failed. You can retry your booking from your dashboard.</p>
      <Button onClick={() => router.push("/")}>Return to Home</Button>
    </div>
  );
}