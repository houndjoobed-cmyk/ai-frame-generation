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
  // Use 'fr' as default to match the primary audience. 
  // This MUST be the same value on server and client to prevent hydration mismatch.
  const defaultLocale: Locale = "fr"
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // After mount, check for a stored preference or detect browser language
    const storedLocale = localStorage.getItem("NEXT_LOCALE") as Locale
    if (storedLocale && (storedLocale === "en" || storedLocale === "fr")) {
      setLocaleState(storedLocale)
    } else {
      const browserLang = navigator.language.startsWith("fr") ? "fr" : "en"
      setLocaleState(browserLang)
      localStorage.setItem("NEXT_LOCALE", browserLang)
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("NEXT_LOCALE", newLocale)
      document.documentElement.lang = newLocale
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const currentDict = translations[locale] || translations.fr
    let text = (currentDict as Record<string, string>)[key]

    if (!text) {
      // Fallback to French if key is missing
      text = (translations.fr as Record<string, string>)[key] || key
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value))
      })
    }

    return text
  }

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
