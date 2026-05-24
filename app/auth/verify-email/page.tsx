"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Frame, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const { t } = useI18n()

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function verify() {
      if (!token || !email) {
        setStatus("error")
        setErrorMessage("Token ou email manquant")
        return
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        })

        const data = await res.json()

        if (res.ok) {
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMessage(data.error || "Verification failed")
        }
      } catch {
        setStatus("error")
        setErrorMessage("Une erreur réseau est survenue.")
      }
    }

    verify()
  }, [token, email])

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
          <CardHeader className="text-center">
            {status === "verifying" && (
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
            {status === "error" && (
              <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <XCircle className="w-6 h-6" />
              </div>
            )}

            <CardTitle className="text-2xl">
              {status === "verifying" ? (t("auth.verifyingTitle") || "Vérification en cours") : ""}
              {status === "success" ? (t("auth.verifySuccessTitle") || "Compte vérifié !") : ""}
              {status === "error" ? (t("auth.verifyErrorTitle") || "Échec de vérification") : ""}
            </CardTitle>
            <CardDescription className="mt-2 text-center">
              {status === "verifying" && (t("auth.verifyingDesc") || "Veuillez patienter pendant que nous validons votre adresse e-mail.")}
              {status === "success" && (t("auth.verifySuccessDesc") || "Votre adresse e-mail a été validée avec succès. Vous pouvez maintenant vous connecter.")}
              {status === "error" && (
                errorMessage === "Token has expired" 
                  ? (t("auth.verifyExpiredDesc") || "Le lien de vérification a expiré.") 
                  : (t("auth.verifyErrorDesc") || "Ce lien est invalide ou a expiré.")
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {status === "success" && (
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  {t("header.signIn")}
                </Link>
              </Button>
            )}

            {status === "error" && (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/register">
                    {t("auth.signUp")}
                  </Link>
                </Button>
                {email && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/auth/resend-verification", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email }),
                          })
                          if (res.ok) {
                            alert(t("auth.toast.verificationResent") || "E-mail de vérification renvoyé !")
                          }
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-sm text-primary hover:underline font-medium cursor-pointer bg-transparent border-0"
                    >
                      {t("auth.resendEmail") || "Renvoyer l'e-mail de vérification"}
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
