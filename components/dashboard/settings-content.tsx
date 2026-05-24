"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, User, CreditCard, Receipt, Settings as SettingsIcon, Check, X, ShieldAlert, Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import Link from "next/link"

interface SettingsContentProps {
  initialProfile: any
  initialSubscription: any
  initialPayments: any[]
}

export function SettingsContent({
  initialProfile,
  initialSubscription,
  initialPayments,
}: SettingsContentProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { t, locale } = useI18n()

  const [name, setName] = useState(initialProfile?.display_name || session?.user?.name || "")
  const [bio, setBio] = useState(initialProfile?.bio || "")
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isCancelLoading, setIsCancelLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsProfileLoading(true)

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed")
      }

      // Update session
      await update({ name })

      toast.success(t("settings.toast.updated") || "Profil mis à jour avec succès")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || t("settings.toast.updateFailed") || "Échec de la mise à jour du profil")
    } finally {
      setIsProfileLoading(false)
    }
  }

  async function handleCancelSubscription() {
    setIsCancelLoading(true)
    try {
      const res = await fetch("/api/payments/kkiapay-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cancellation failed")
      }

      toast.success("Votre abonnement a été résilié avec succès.")
      setShowCancelConfirm(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Impossible de résilier l'abonnement.")
    } finally {
      setIsCancelLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  const getPlanDetails = (slug: string) => {
    switch (slug) {
      case "pro":
        return {
          credits: "20 crédits IA / mois",
          exports: "50 exports / mois (HD)",
          features: ["Accès aux cadres premium", "Support prioritaire", "Stockage 1 Go"],
        }
      case "business":
        return {
          credits: "100 crédits IA / mois",
          exports: "Exports illimités (Ultra HD/4K)",
          features: ["Tous les cadres inclus", "Support prioritaire 24/7", "Stockage 10 Go", "Modèles IA avancés"],
        }
      default:
        return {
          credits: "3 crédits IA / mois",
          exports: "5 exports / mois (Standard)",
          features: ["Cadres de base uniquement", "Exportation standard", "Stockage 100 Mo"],
        }
    }
  }

  const activePlan = initialSubscription?.plan || { name: "Gratuit", slug: "free" }
  const planDetails = getPlanDetails(activePlan.slug)
  const isCancelled = initialSubscription?.status === "cancelled"
  const isPaidPlan = activePlan.slug !== "free"

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            {t("settings.tabs.profile") || "Profil"}
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="w-4 h-4" />
            {t("settings.tabs.subscription") || "Abonnement"}
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <Receipt className="w-4 h-4" />
            {t("settings.tabs.billing") || "Facturation"}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/60 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle>{t("settings.profile")}</CardTitle>
              <CardDescription>
                {t("settings.profileDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 ring-4 ring-primary/10">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {name.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{session?.user?.name || "Utilisateur"}</h3>
                    <p className="text-sm text-muted-foreground font-light">{session?.user?.email}</p>
                  </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold">{t("settings.displayName")}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("settings.namePlaceholder")}
                      className="bg-background/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold">{t("settings.email")}</Label>
                    <Input
                      id="email"
                      value={session?.user?.email || ""}
                      disabled
                      className="bg-muted/50 cursor-not-allowed opacity-80"
                    />
                    <p className="text-xs text-muted-foreground font-light">
                      {t("settings.emailDesc")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-bold">{t("settings.bio")}</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t("settings.bioPlaceholder")}
                      className="bg-background/50"
                      rows={4}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isProfileLoading} className="rounded-full px-6 font-bold">
                  {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("settings.saveChanges")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive font-black flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                {t("settings.account") || "Sécurité du Compte"}
              </CardTitle>
              <CardDescription>
                {t("settings.accountDesc") || "Actions de sécurité sur votre compte"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold">{t("settings.signOut")}</h4>
                  <p className="text-sm text-muted-foreground font-light">
                    {t("settings.signOutDesc")}
                  </p>
                </div>
                <Button variant="outline" className="rounded-full border-border/60 hover:bg-muted font-bold" onClick={() => router.push("/api/auth/signout")}>
                  {t("settings.signOut")}
                </Button>
              </div>
              <Separator className="bg-destructive/10" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-destructive">{t("settings.deleteAccount")}</h4>
                  <p className="text-sm text-muted-foreground font-light">
                    {t("settings.deleteAccountDesc")}
                  </p>
                </div>
                <Button variant="destructive" className="rounded-full font-bold" disabled>
                  {t("settings.deleteAccount")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Subscription */}
        <TabsContent value="subscription" className="space-y-6">
          <Card className="border-border/60 bg-card/45 backdrop-blur-md relative overflow-hidden">
            {activePlan.slug !== "free" && (
              <div className="absolute top-0 right-0 bg-primary/10 text-primary border-l border-b border-primary/20 px-4 py-1.5 text-xs font-bold rounded-bl-xl uppercase tracking-wider">
                {activePlan.slug}
              </div>
            )}
            <CardHeader>
              <CardTitle>{t("settings.subscription.title") || "Votre forfait actuel"}</CardTitle>
              <CardDescription>
                {t("settings.subscription.desc") || "Gérez les limites de votre offre de cadre photo."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-muted/30 border border-border/40 p-6 rounded-2xl">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{t("settings.subscription.current") || "Plan actuel"}</span>
                  <h3 className="text-3xl font-black text-foreground mt-1 flex items-center gap-2">
                    {activePlan.name}
                    {!isPaidPlan && (
                      <Badge variant="outline" className="border-border/60 font-medium text-xs">
                        {t("settings.subscription.status.free") || "Gratuit"}
                      </Badge>
                    )}
                  </h3>
                  {isPaidPlan && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <Badge className={isCancelled ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20"}>
                        {isCancelled 
                          ? (t("settings.subscription.status.cancelled") || "Résilier - Actif") 
                          : (t("settings.subscription.status.active") || "Actif")
                        }
                      </Badge>
                      {initialSubscription?.current_period_end && (
                        <span className="text-xs text-muted-foreground font-light flex items-center gap-1.5 ml-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {isCancelled 
                            ? `Prend fin le : ${formatDate(initialSubscription.current_period_end)}`
                            : `${t("settings.subscription.periodEnd") || "Prochain prélèvement le"} : ${formatDate(initialSubscription.current_period_end)}`
                          }
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {activePlan.slug !== "business" && (
                    <Link href="/pricing">
                      <Button className="rounded-full font-bold px-6 bg-primary hover:bg-primary/95 text-primary-foreground">
                        {t("settings.subscription.upgrade") || "Changer de forfait"}
                      </Button>
                    </Link>
                  )}
                  {isPaidPlan && !isCancelled && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCancelConfirm(true)}
                      className="rounded-full font-bold border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 text-destructive"
                    >
                      {t("settings.subscription.cancel") || "Résilier l'abonnement"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Subscription details list */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Avantages inclus</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-border/40 p-4 rounded-xl bg-background/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">✓</div>
                    <div>
                      <h5 className="font-bold text-sm">Génération d'images IA</h5>
                      <p className="text-xs text-muted-foreground font-light">{planDetails.credits}</p>
                    </div>
                  </div>
                  <div className="border border-border/40 p-4 rounded-xl bg-background/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">✓</div>
                    <div>
                      <h5 className="font-bold text-sm">Exportation de projets</h5>
                      <p className="text-xs text-muted-foreground font-light">{planDetails.exports}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/10 border border-border/40 rounded-xl p-6 mt-4">
                  <h5 className="font-bold text-sm mb-3">Toutes les fonctionnalités incluses :</h5>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground font-light">
                    {planDetails.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Confirmation Dialog modal overlay */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="max-w-md w-full border-border/60 bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader>
                  <CardTitle className="text-destructive font-black">Confirmation de résiliation</CardTitle>
                  <CardDescription>
                    {t("settings.subscription.cancelConfirm") || "Êtes-vous sûr de vouloir résilier votre abonnement actif ? Vous conserverez vos accès payants jusqu'à la fin de votre période de facturation."}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <Button 
                    variant="outline" 
                    className="rounded-full font-bold border-border/60"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={isCancelLoading}
                  >
                    Conserver l'abonnement
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="rounded-full font-bold"
                    onClick={handleCancelSubscription}
                    disabled={isCancelLoading}
                  >
                    {isCancelLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirmer la résiliation
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Billing */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-border/60 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle>{t("settings.billing.title") || "Historique de facturation"}</CardTitle>
              <CardDescription>
                {t("settings.billing.desc") || "Retrouvez ici la liste de vos paiements."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initialPayments.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Receipt className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <h4 className="font-bold text-muted-foreground">
                    {t("settings.billing.empty") || "Aucun paiement enregistré"}
                  </h4>
                  <p className="text-xs text-muted-foreground/60 font-light mt-1 max-w-xs">
                    Les transactions effectuées via KkiaPay apparaîtront ici automatiquement.
                  </p>
                </div>
              ) : (
                <div className="border border-border/40 rounded-xl overflow-hidden bg-background/20">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border/40">
                        <TableHead className="font-bold">{t("settings.billing.table.date") || "Date"}</TableHead>
                        <TableHead className="font-bold">{t("settings.billing.table.desc") || "Description"}</TableHead>
                        <TableHead className="font-bold">{t("settings.billing.table.amount") || "Montant"}</TableHead>
                        <TableHead className="font-bold">{t("settings.billing.table.ref") || "Référence"}</TableHead>
                        <TableHead className="font-bold">{t("settings.billing.table.status") || "Statut"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-border/40 hover:bg-muted/20">
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {formatDate(payment.created_at)}
                          </TableCell>
                          <TableCell className="font-light text-xs sm:text-sm">
                            {payment.description || "Paiement abonnement"}
                          </TableCell>
                          <TableCell className="font-bold text-xs sm:text-sm text-foreground">
                            {Number(payment.amount).toLocaleString()} {payment.currency}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">
                            {payment.provider_reference || payment.id}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                payment.status === "completed" 
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20" 
                                  : payment.status === "failed" 
                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20"
                                    : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20"
                              }
                            >
                              {payment.status === "completed" ? "Succès" : payment.status === "failed" ? "Échec" : payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
