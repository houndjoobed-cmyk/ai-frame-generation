"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Paintbrush, Plus, Clock, MessageSquare, Download, AlertCircle, Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface CustomOrder {
  id: string
  event_name: string
  event_date: string | null
  event_type: string
  description: string
  reference_image_url: string | null
  budget: number | null
  status: "pending" | "awaiting_payment" | "in_progress" | "completed" | "cancelled"
  designer_notes: string | null
  completed_frame_url: string | null
  created_at: string
}

declare global {
  interface Window {
    openKkiapayWidget: (options: any) => void;
    onKkiapayCustomOrderSuccess?: (response: any) => void;
  }
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  awaiting_payment: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
}

const statusFrench = {
  pending: "En attente",
  awaiting_payment: "Attente paiement",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
}

const typeFrench = {
  birthday: "Anniversaire",
  wedding: "Mariage",
  holiday: "Vacances / Fête",
  graduation: "Remise de diplôme",
  corporate: "Entreprise / Corporate",
  social: "Réseaux Sociaux",
  other: "Autre événement",
}

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/custom-orders")
      const data = await response.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        toast.error(data.error || "Impossible de charger vos commandes.")
      }
    } catch (error) {
      console.error("Error fetching custom orders:", error)
      toast.error("Une erreur s'est produite lors du chargement des commandes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Hook up Kkiapay Success Callback
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.onKkiapayCustomOrderSuccess = async (response: any) => {
        console.log("Kkiapay success custom order:", response)
        
        let orderId = ""
        try {
          if (response.data) {
            const parsedData = JSON.parse(response.data)
            orderId = parsedData.orderId
          }
        } catch (e) {
          console.error("Failed to parse payment callback data:", e)
        }

        if (!orderId) {
          toast.error("Impossible de récupérer l'ID de commande pour la validation.")
          return
        }

        setPayingOrderId(orderId)
        const toastId = toast.loading("Validation du paiement en cours...")

        try {
          const res = await fetch("/api/custom-orders/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              transactionId: response.transactionId,
            }),
          })

          const data = await res.json()
          toast.dismiss(toastId)
          
          if (res.ok && data.success) {
            toast.success("Paiement validé ! Votre commande est maintenant en cours de réalisation.")
            fetchOrders()
          } else {
            toast.error(data.error || "Erreur de validation du paiement.")
          }
        } catch (err) {
          toast.dismiss(toastId)
          console.error("Payment verification failed:", err)
          toast.error("Erreur réseau lors de la validation du paiement.")
        } finally {
          setPayingOrderId(null)
        }
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.onKkiapayCustomOrderSuccess
      }
    }
  }, [orders])

  // Handle mobile redirect callback with transaction_id in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const transactionId = searchParams.get("transaction_id")
      
      if (transactionId) {
        const verifyPaymentRedirect = async () => {
          const toastId = toast.loading("Validation du paiement en cours...")
          try {
            const res = await fetch("/api/custom-orders/pay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transactionId,
              }),
            })

            const data = await res.json()
            toast.dismiss(toastId)

            if (res.ok && data.success) {
              toast.success("Paiement validé ! Votre commande est maintenant en cours de réalisation.")
              fetchOrders()
            } else {
              toast.error(data.error || "Erreur de validation du paiement.")
            }
          } catch (err) {
            toast.dismiss(toastId)
            console.error("Payment redirect verification failed:", err)
            toast.error("Erreur réseau lors de la validation du paiement.")
          } finally {
            // Clean up the transaction_id from the URL query parameters
            const url = new URL(window.location.href)
            url.searchParams.delete("transaction_id")
            window.history.replaceState({}, document.title, url.pathname + url.search)
          }
        }
        
        verifyPaymentRedirect()
      }
    }
  }, [])

  const triggerPayment = (order: CustomOrder) => {
    if (!order.budget || order.budget <= 0) {
      toast.error("Le montant du devis n'a pas encore été fixé par le graphiste.")
      return
    }

    if (typeof window !== "undefined" && window.openKkiapayWidget) {
      setPayingOrderId(order.id)
      
      const callbackUrl = window.location.origin + "/dashboard/custom-orders"

      window.openKkiapayWidget({
        amount: order.budget,
        position: "center",
        key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || "547e1af056a111f1bcb3fd035618d464",
        sandbox: true,
        data: JSON.stringify({
          orderId: order.id,
        }),
        callback: callbackUrl,
      })
    } else {
      toast.error("Le module de paiement Kkiapay n'est pas prêt. Veuillez patienter ou recharger la page.")
    }
  }

  const handleDownload = async (url: string, orderId: string, eventName: string) => {
    setDownloadingId(orderId)
    toast.info("Téléchargement du cadre en cours...")
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      
      const cleanName = eventName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      
      link.download = `cadre-${cleanName || "sur-mesure"}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
      toast.success("Téléchargement réussi !")
    } catch (error) {
      console.error("Error downloading completed frame:", error)
      toast.error("Échec du téléchargement direct. Ouverture dans un nouvel onglet.")
      window.open(url, "_blank")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Load Kkiapay Widget script CDN */}
      <Script 
        src="https://cdn.kkiapay.me/k.js" 
        strategy="lazyOnload" 
        onLoad={() => console.log("Kkiapay SDK loaded successfully on custom orders page.")}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commandes sur-mesure</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Faites réaliser un cadre photo personnalisé unique par notre graphiste professionnel pour vos événements.
          </p>
        </div>
        <Link href="/dashboard/custom-orders/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Commander un cadre
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-2xl bg-muted/10 p-8">
          <Spinner className="h-8 w-8 mb-2" />
          <span className="text-sm text-muted-foreground">Chargement de vos commandes...</span>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed bg-muted/10 flex flex-col items-center justify-center p-8 md:p-16 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Paintbrush className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-semibold mb-2">Aucune commande pour le moment</CardTitle>
          <CardDescription className="max-w-md mb-6">
            Besoin d'un cadre unique pour un anniversaire, un mariage ou un événement d'entreprise ? Soumettez vos consignes à notre graphiste professionnel.
          </CardDescription>
          <Link href="/dashboard/custom-orders/new">
            <Button>Soumettre ma première demande</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b p-5 flex flex-row items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{order.event_name}</h3>
                    <Badge variant="outline" className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                      {statusFrench[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span>
                      Type: <strong>{typeFrench[order.event_type as keyof typeof typeFrench] || order.event_type}</strong>
                    </span>
                    {order.budget && (
                      <span>
                        Budget / Devis: <strong>{order.budget} XOF</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === "awaiting_payment" && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => triggerPayment(order)}
                      disabled={payingOrderId === order.id}
                    >
                      {payingOrderId === order.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="h-3.5 w-3.5" />
                      )}
                      {payingOrderId === order.id ? "Paiement..." : `Payer le devis (${order.budget} XOF)`}
                    </Button>
                  )}

                  {order.status === "completed" && order.completed_frame_url && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleDownload(order.completed_frame_url!, order.id, order.event_name)}
                      disabled={downloadingId === order.id}
                    >
                      {downloadingId === order.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {downloadingId === order.id ? "Téléchargement..." : "Télécharger le cadre"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Description de la demande
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{order.description}</p>
                </div>

                {order.reference_image_url && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Image de référence / Inspiration
                    </h4>
                    <a
                      href={order.reference_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Voir l'image d'inspiration téléversée
                    </a>
                  </div>
                )}

                {order.designer_notes && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mt-2 space-y-1">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Note du graphiste
                    </h4>
                    <p className="text-sm text-muted-foreground">{order.designer_notes}</p>
                  </div>
                )}

                {order.status === "completed" && !order.completed_frame_url && (
                  <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-3 rounded-lg border border-yellow-200/50">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Le cadre a été marqué comme terminé mais aucun fichier n'a encore été mis en ligne.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
