"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Paintbrush, Clock, User, Mail, DollarSign, ExternalLink, Edit, CheckCircle, Upload, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface CustomOrder {
  id: string
  user_id: string
  userName: string
  userEmail: string
  event_name: string
  event_date: string | null
  event_type: string
  description: string
  reference_image_url: string | null
  budget: number | null
  status: "pending" | "awaiting_payment" | "in_progress" | "completed" | "cancelled"
  designer_notes: string | null
  completed_frame_url: string | null
  payment_reference: string | null
  created_at: string
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
  other: "Autre",
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states for update
  const [status, setStatus] = useState<"pending" | "awaiting_payment" | "in_progress" | "completed" | "cancelled">("pending")
  const [notes, setNotes] = useState("")
  const [budget, setBudget] = useState("")
  const [completedUrl, setCompletedUrl] = useState("")
  const [base64File, setBase64File] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/custom-orders")
      const data = await response.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        toast.error(data.error || "Impossible de charger les commandes.")
      }
    } catch (error) {
      console.error("Error fetching admin custom orders:", error)
      toast.error("Erreur serveur lors de la récupération des commandes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleEditClick = (order: CustomOrder) => {
    setSelectedOrder(order)
    setStatus(order.status)
    setNotes(order.designer_notes || "")
    setCompletedUrl(order.completed_frame_url || "")
    setBudget(order.budget ? order.budget.toString() : "")
    setBase64File(null)
    setFileName("")
    setDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => {
      setBase64File(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setSubmitting(true)

    try {
      const response = await fetch("/api/admin/custom-orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status,
          designerNotes: notes,
          completedFrameUrl: completedUrl || null,
          completedFrameBase64: base64File,
          budget: budget ? parseFloat(budget) : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Commande mise à jour avec succès !")
        setDialogOpen(false)
        fetchOrders()
      } else {
        toast.error(data.error || "Impossible de mettre à jour la commande.")
      }
    } catch (error) {
      console.error("Error updating custom order:", error)
      toast.error("Une erreur s'est produite lors de la mise à jour.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commandes sur-mesure</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez et traitez les demandes de cadres photo personnalisés formulées par vos clients.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-2xl bg-muted/10 p-8">
          <Spinner className="h-8 w-8 mb-2" />
          <span className="text-sm text-muted-foreground">Chargement des demandes clients...</span>
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 md:p-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <Paintbrush className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-semibold mb-2">Aucune commande pour le moment</CardTitle>
          <CardDescription className="max-w-md">
            Les demandes des clients s'afficheront ici lorsqu'ils commanderont des cadres photo sur-mesure.
          </CardDescription>
        </Card>
      ) : (
        <Card className="border shadow-sm overflow-hidden bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Soumission</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {order.userName}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {order.userEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{order.event_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeFrench[order.event_type as keyof typeof typeFrench] || order.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.budget ? (
                        <span className="text-sm font-semibold flex items-center text-emerald-600 dark:text-emerald-400">
                          {order.budget} XOF
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Non spécifié</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={statusColors[order.status]}>
                          {statusFrench[order.status]}
                        </Badge>
                        {order.payment_reference && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Payé (Réf: {order.payment_reference.substring(0, 8)})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(order)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl">Traiter la commande de cadre</DialogTitle>
              <DialogDescription>
                Mettez à jour le statut du cadre, téléversez le résultat et laissez des notes pour le client.
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/40 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Détails de l'événement
                    </h4>
                    <p className="text-sm font-semibold">{selectedOrder.event_name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Instructions du client
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedOrder.description}</p>
                  </div>
                  {selectedOrder.reference_image_url && (
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Inspiration client
                      </h4>
                      <a
                        href={selectedOrder.reference_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Voir le visuel de référence <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {selectedOrder.payment_reference && (
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Paiement validé
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Référence KkiaPay : {selectedOrder.payment_reference}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut de la commande</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="pending">En attente (Pending)</option>
                    <option value="awaiting_payment">Attente paiement (Awaiting Payment)</option>
                    <option value="in_progress">En cours (In Progress)</option>
                    <option value="completed">Terminée (Completed)</option>
                    <option value="cancelled">Annulée (Cancelled)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Devis / Prix (XOF)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    placeholder="Montant du devis..."
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designerNotes">Notes / Retour pour le client</Label>
                  <Textarea
                    id="designerNotes"
                    placeholder="Laissez un message au client sur l'avancement ou des conseils d'utilisation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Téléverser le cadre finalisé (.png)</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/png"
                        onChange={handleFileChange}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  {fileName && (
                    <span className="text-xs text-emerald-600 font-medium">Fichier prêt : {fileName}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completedUrl">Ou coller l'URL directe du fichier fini</Label>
                  <Input
                    id="completedUrl"
                    type="url"
                    placeholder="https://..."
                    value={completedUrl}
                    onChange={(e) => setCompletedUrl(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 border-t pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Fermer
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
