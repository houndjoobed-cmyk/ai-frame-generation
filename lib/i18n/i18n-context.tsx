"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { translations, Locale } from "./translations"

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedLocale = localStorage.getItem("NEXT_LOCALE") as Locale
    if (storedLocale && (storedLocale === "en" || storedLocale === "fr")) {
      setLocaleState(storedLocale)
    } else {
      // Check browser language preference
      const browserLang = navigator.language.startsWith("fr") ? "fr" : "en"
      setLocaleState(browserLang)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("NEXT_LOCALE", newLocale)
      document.documentElement.lang = newLocale
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const currentDict = translations[locale] || translations.en
    let text = (currentDict as Record<string, string>)[key]

    if (!text) {
      // Fallback to English if key is missing in French
      text = (translations.en as Record<string, string>)[key] || key
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value))
      })
    }

    return text
  }

  // To prevent hydration mismatch, we can still render children but ensure t() works immediately with default/stored locale
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
