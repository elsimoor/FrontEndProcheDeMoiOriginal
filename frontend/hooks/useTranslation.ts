"use client"

import { useLanguage } from "@/context/LanguageContext"
import { t } from "@/lib/i18n"

/**
 * A React hook to simplify access to translations.  It reads the
 * current locale from the LanguageContext and returns a function
 * that can be called with a translation key.  The returned
 * function will use the appropriate dictionary based on the
 * current language.
 */
export default function useTranslation() {
  const { locale } = useLanguage()
  return {
    t: (key: string) => t(key, locale),
    locale,
  }
}