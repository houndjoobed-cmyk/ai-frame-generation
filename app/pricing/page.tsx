"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle, Loader2, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

declare global {
  interface Window {
    openKkiapayWidget: (options: any) => void;
    onKkiapaySuccess?: (response: any) => void;
  }
}

export default function PricingPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const router = useRouter()
  const supabase = createClient()

  const [isAnnual, setIsAnnual] = useState(false)
  const [dbPlans, setDbPlans] = useState<any[]>([])
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [dbLoading, setDbLoading] = useState(true)

  // Default fallback plans if Supabase isn't populated yet
  const fallbackPlans = [
    {
      id: "free-plan-id",
      name: t("pricing.free.title"),
      slug: "starter",
      description: t("pricing.free.desc"),
      price_monthly: 0,
      price_yearly: 0,
      currency: "FCFA",
      features: [
        "5 crédits IA inclus",
        "Exportations standard",
        "Cadres photo gratuits uniquement",
        "100 Mo d'espace de stockage",
      ],
      has_ai_generation: true,
      has_hd_export: false,
    },
    {
      id: "pro-plan-id",
      name: t("pricing.pro.title"),
      slug: "pro",
      description: t("pricing.pro.desc"),
      price_monthly: 4900,
      price_yearly: 3900 * 12,
      currency: "FCFA",
      features: [
        "100 crédits IA par mois",
        "Exportations HD incluses",
        "Accès complet aux cadres premium",
        "1 Go d'espace de stockage",
        "Support par email prioritaire",
      ],
      has_ai_generation: true,
      has_hd_export: true,
      popular: true,
    },
    {
      id: "business-plan-id",
      name: t("pricing.ent.title"),
      slug: "business",
      description: t("pricing.ent.desc"),
      price_monthly: 19900,
      price_yearly: 15900 * 12,
      currency: "FCFA",
      features: [
        "Crédits IA illimités",
        "Exportations Ultra HD (4K)",
        "Tous les cadres premium inclus",
        "Stockage illimité",
        "Support prioritaire 24/7",
        "Intégration d'événements physiques",
      ],
      has_ai_generation: true,
      has_hd_export: true,
    },
  ]

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })

        if (error) throw error
        if (data && data.length > 0) {
          setDbPlans(data)
        }
      } catch (err) {
        console.error("Error fetching subscription plans:", err)
      } finally {
        setDbLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const plans = dbPlans.length > 0 ? dbPlans : fallbackPlans

  // Setup Kkiapay callback
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.onKkiapaySuccess = async (response: any) => {
        console.log("Kkiapay success response:", response)
        setLoadingPlanId(null)

        try {
          const res = await fetch("/api/payments/kkiapay-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: response.transactionId,
            }),
          })

          const data = await res.json()
          if (res.ok && data.success) {
            toast.success("Abonnement activé avec succès !")
            router.push("/dashboard")
          } else {
            toast.error(data.error || "Erreur de validation du paiement.")
          }
        } catch (err) {
          console.error("Verification error:", err)
          toast.error("Erreur de communication avec le serveur de paiement.")
        }
      }
    }
  }, [router])

  const handleSubscribe = async (plan: any) => {
    if (!session) {
      toast.error("Veuillez vous connecter pour souscrire à un forfait.")
      router.push(`/auth/login?callbackUrl=/pricing`)
      return
    }

    if (plan.price_monthly === 0) {
      toast.success("Vous avez activé le plan Starter gratuit !")
      router.push("/dashboard")
      return
    }

    setLoadingPlanId(plan.id)
    const amount = isAnnual ? plan.price_yearly / 12 : plan.price_monthly

    // Trigger Kkiapay widget
    if (typeof window !== "undefined" && window.openKkiapayWidget) {
      window.openKkiapayWidget({
        amount: amount,
        position: "center",
        // Test/Sandbox API key for local dev. Use ENV variable in prod
        key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || "dd9f1b2b801a61ad34f2d72f10b741df0dbb6e22",
        sandbox: true,
        data: JSON.stringify({
          userId: (session?.user as any)?.id,
          planId: plan.id,
          isAnnual: isAnnual,
        }),
        email: (session?.user as any)?.email || "",
        phone: "",
        callback: "onKkiapaySuccess",
      })
    } else {
      toast.error("Le module de paiement Kkiapay n'est pas chargé.")
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <Header />
      
      {/* CDN loaded Kkiapay script */}
      <Script 
        src="https://cdn.kkiapay.me/k.js" 
        strategy="lazyOnload" 
        onLoad={() => console.log("Kkiapay SDK loaded successfully.")}
      />

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />

      <main className="flex-1 py-28 relative z-10">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-balance">
              {t("pricing.title")}
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto font-light">
              {t("pricing.subtitle")}
            </p>
          </motion.div>

          {/* Pricing Toggle */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className={`text-base ${!isAnnual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              {t("pricing.monthly")}
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 bg-muted rounded-full p-1 transition-colors duration-300 hover:bg-muted/80 focus:outline-none"
            >
              <div 
                className={`w-6 h-6 bg-primary rounded-full shadow-md transform transition-transform duration-300 ${
                  isAnnual ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-base flex items-center gap-1.5 ${isAnnual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              {t("pricing.annual")}
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                -20%
              </Badge>
            </span>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-16 grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto text-left items-stretch">
            {plans.map((plan, index) => {
              const amount = isAnnual 
                ? Math.round(plan.price_yearly / 12) 
                : plan.price_monthly
              
              const isPopular = plan.slug === "pro"

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="h-full flex"
                >
                  <Card className={`relative h-full flex flex-col justify-between overflow-hidden border bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-2xl ${
                    isPopular 
                      ? "border-primary shadow-xl shadow-primary/5 lg:scale-[1.03]" 
                      : "border-border/60 hover:border-primary/20"
                  }`}>
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-bl-xl flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        {t("pricing.pro.badge")}
                      </div>
                    )}

                    <CardHeader className="p-8">
                      <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                      <CardDescription className="mt-2 text-sm text-muted-foreground font-light min-h-[40px]">
                        {plan.description}
                      </CardDescription>
                      
                      <div className="mt-6 flex items-baseline">
                        <span className="text-5xl font-black tracking-tight">
                          {plan.price_monthly === 0 ? "0" : amount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground font-light text-lg ml-2">
                          FCFA / {t("pricing.monthly").toLowerCase()}
                        </span>
                      </div>
                      
                      {isAnnual && plan.price_monthly > 0 && (
                        <p className="text-xs text-primary font-medium mt-2">
                          Facturé annuellement ({(plan.price_yearly).toLocaleString()} FCFA/an)
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="px-8 pb-8 grow">
                      <div className="border-t border-border/40 my-6" />
                      <ul className="space-y-4">
                        {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-light text-muted-foreground leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="p-8 pt-0">
                      <Button
                        className={`w-full py-6 rounded-full font-bold text-base transition-all duration-300 ${
                          isPopular 
                            ? "bg-linear-to-r from-primary to-purple-600 hover:scale-[1.02] shadow-lg shadow-primary/20" 
                            : "variant-outline hover:bg-muted hover:scale-[1.02]"
                        }`}
                        onClick={() => handleSubscribe(plan)}
                        disabled={loadingPlanId === plan.id}
                      >
                        {loadingPlanId === plan.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : plan.price_monthly === 0 ? (
                          t("pricing.free.btn")
                        ) : (
                          t("pricing.pro.btn")
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-32 max-w-4xl mx-auto text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-center">
              {t("pricing.faq.title")}
            </h2>
            <p className="text-muted-foreground text-center font-light mt-2 mb-12">
              {t("pricing.faq.subtitle")}
            </p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card/35 backdrop-blur border-border/40 p-6">
                <h4 className="font-bold text-base flex gap-2">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  {t("pricing.faq.q1")}
                </h4>
                <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                  {t("pricing.faq.a1")}
                </p>
              </Card>

              <Card className="bg-card/35 backdrop-blur border-border/40 p-6">
                <h4 className="font-bold text-base flex gap-2">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  Quels modes de paiement locaux sont acceptés ?
                </h4>
                <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                  Grâce à Kkiapay, nous acceptons MTN Mobile Money, Moov Flooz, Wave, Orange Money et les cartes bancaires Visa/Mastercard locales.
                </p>
              </Card>

              <Card className="bg-card/35 backdrop-blur border-border/40 p-6">
                <h4 className="font-bold text-base flex gap-2">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  {t("pricing.faq.q3")}
                </h4>
                <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                  {t("pricing.faq.a3")}
                </p>
              </Card>

              <Card className="bg-card/35 backdrop-blur border-border/40 p-6">
                <h4 className="font-bold text-base flex gap-2">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  {t("pricing.faq.q4")}
                </h4>
                <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                  {t("pricing.faq.a4")}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
