"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";

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
  // Translation hook and language context.  Use t() to resolve keys
  // into the current language and provide a language toggle.
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setLocale("en")}
          className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("fr")}
          className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
        >
          FR
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-4">{t("paymentSuccessful")}</h1>
      <p className="mb-8 text-gray-700 text-center max-w-lg">{t("paymentSuccessfulMsg")}</p>
      <Button onClick={() => router.push("/")}>{t("returnHome")}</Button>
    </div>
  );
}