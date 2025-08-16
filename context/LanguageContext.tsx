"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"

/**
 * LanguageContext provides the current locale (language) and a setter to
 * update it. Components throughout the application can consume this
 * context to determine which language to render and to allow users to
 * switch languages at runtime. The default locale is English ("en").
 */
export type Locale = "en" | "fr"

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Persist the selected language in localStorage so that it remains
  // consistent across page reloads. Default to English if no preference
  // exists. The state is initialised from localStorage on the first
  // render.
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("locale") as Locale | null
      if (stored === "en" || stored === "fr") {
        return stored
      }
    }
    return "en"
  })

  // When the locale changes, save it to localStorage for persistence.
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale)
    }
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}