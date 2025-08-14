"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Generic success page displayed after a user completes a payment on
 * Stripe.  The Stripe checkout is configured to redirect here upon
 * success.  We display a thank you message and a button to return
 * home or to the appropriate module.  In a real application you
 * might verify the session_id query parameter via an API call to
 * confirm the payment, but because the backend webhook updates the
 * payment status we do not perform any additional checks here.
 */

export default function PaymentSuccessPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
      <p className="mb-8 text-gray-700">Thank you for your payment. Your transaction has been completed.</p>
      <Button onClick={() => router.push("/")}>Return to Home</Button>
    </div>
  );
}