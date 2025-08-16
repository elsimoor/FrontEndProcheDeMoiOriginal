"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Cancellation page shown when a user aborts the payment on Stripe
 * or the checkout fails.  We inform the user that the payment was
 * cancelled and provide navigation to return to the previous page or
 * home.  The associated reservation remains in pending status in the
 * backend.
 */

export default function PaymentCancelPage() {
  const router = useRouter();
  // Translation hook and language context.  We use t() to look up
  // strings in the current locale and allow the user to switch languages.
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
      <h1 className="text-3xl font-bold mb-4">{t("paymentCancelled")}</h1>
      <p className="mb-8 text-gray-700 text-center max-w-lg">{t("paymentCancelledMsg")}</p>
      <Button onClick={() => router.push("/")}>{t("returnHome")}</Button>
    </div>
  );
}