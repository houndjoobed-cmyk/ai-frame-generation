"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Frame, Loader2, Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setIsSuccess(true)
        toast.success(t("auth.toast.forgotSuccess") || "Lien de réinitialisation envoyé !")
      } else {
        toast.error(t("auth.toast.error"))
      }
    } catch {
      toast.error(t("auth.toast.error"))
    } finally {
      setIsLoading(false)
    }
  }

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
            <CardTitle className="text-2xl text-center">
              {t("auth.forgotPasswordTitle") || "Mot de passe oublié"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuccess 
                ? (t("auth.forgotPasswordSuccessDesc") || "Si cet e-mail correspond à un compte, vous recevrez un lien pour réinitialiser votre mot de passe.")
                : (t("auth.forgotPasswordDesc") || "Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuccess ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth.checkEmailSpam") || "N'oubliez pas de vérifier vos courriers indésirables (spams) si vous ne recevez rien d'ici quelques minutes."}
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    {t("header.signIn") || "Se connecter"}
                  </Link>
                </Button>
              </div>
            ) : (
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.sendLink") || "Envoyer le lien"}
                </Button>
                <div className="text-center">
                  <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" />
                    {t("auth.backToLogin") || "Retour à la connexion"}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
