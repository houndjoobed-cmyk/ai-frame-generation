"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Frame, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const error = searchParams.get("error")
  const { t } = useI18n()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if email is verified first
      const checkRes = await fetch(`/api/auth/verify-email/status?email=${encodeURIComponent(email)}`)
      const checkData = await checkRes.json()

      if (checkRes.ok && !checkData.verified) {
        router.push(`/auth/login?error=EmailNotVerified&email=${encodeURIComponent(email)}`)
        setIsLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(t("auth.toast.invalid"))
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      toast.error(t("auth.toast.error"))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    await signIn("google", { callbackUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <Image
              src="/logo-full.png"
              alt="Event Frames"
              width={180}
              height={45}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
          <p className="text-muted-foreground">{t("auth.welcomeBack")}</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t("auth.signIn")}</CardTitle>
            <CardDescription className="text-center">
              {t("auth.signInDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                {error === "OAuthAccountNotLinked" && t("auth.error.OAuthAccountNotLinked")}
                {error === "EmailNotVerified" && (
                  <div className="space-y-2">
                    <p>{t("auth.error.EmailNotVerified") || "Votre adresse e-mail n'est pas encore vérifiée."}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        const emailInput = email || searchParams.get("email") || ""
                        if (!emailInput) {
                          toast.error("Veuillez saisir votre adresse e-mail dans le formulaire d'abord.")
                          return
                        }
                        try {
                          const res = await fetch("/api/auth/resend-verification", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: emailInput }),
                          })
                          if (res.ok) {
                            toast.success(t("auth.toast.verificationResent") || "E-mail de vérification renvoyé !")
                          } else {
                            toast.error(t("auth.toast.error"))
                          }
                        } catch {
                          toast.error(t("auth.toast.error"))
                        }
                      }}
                      className="text-xs text-primary hover:underline font-semibold block mx-auto cursor-pointer bg-transparent border-0"
                    >
                      {t("auth.resendEmail") || "Renvoyer l'e-mail de vérification"}
                    </button>
                  </div>
                )}
                {error !== "OAuthAccountNotLinked" && error !== "EmailNotVerified" && t("auth.toast.error")}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {t("auth.google")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("auth.forgot")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("auth.signIn")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                {t("auth.signUp")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
