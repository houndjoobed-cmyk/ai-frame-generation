"use client"

import React, { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Frame, AlertCircle, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const { t } = useI18n()

  const errorMessages: Record<string, string> = {
    Configuration: t("auth.error.Configuration"),
    AccessDenied: t("auth.error.AccessDenied"),
    Verification: t("auth.error.Verification"),
    OAuthSignin: t("auth.error.OAuthSignin"),
    OAuthCallback: t("auth.error.OAuthCallback"),
    OAuthCreateAccount: t("auth.error.OAuthCreateAccount"),
    EmailCreateAccount: t("auth.error.EmailCreateAccount"),
    Callback: t("auth.error.Callback"),
    OAuthAccountNotLinked: t("auth.error.OAuthAccountNotLinked"),
    EmailSignin: t("auth.error.EmailSignin"),
    CredentialsSignin: t("auth.error.CredentialsSignin"),
    SessionRequired: t("auth.error.SessionRequired"),
    Default: t("auth.error.Default"),
  }

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Frame className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">Event Frames</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">{t("auth.error.title")}</CardTitle>
            <CardDescription className="text-center">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">{t("auth.error.tryAgain")}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">{t("auth.error.goHome")}</Link>
              </Button>
            </div>
            {error && (
              <p className="text-center text-xs text-muted-foreground">
                {t("auth.error.code")} {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
