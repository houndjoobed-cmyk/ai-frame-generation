"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Loader2, Paintbrush } from "lucide-react"
import { toast } from "sonner"

export default function NewCustomOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventType, setEventType] = useState("birthday")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  
  const [refImageFile, setRefImageFile] = useState<File | null>(null)
  const [refImageBase64, setRefImageBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image de référence ne doit pas dépasser 5 Mo.")
      return
    }

    setRefImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setRefImageBase64(base64String)
      setImagePreview(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventName || eventName.trim().length < 3) {
      toast.error("Veuillez saisir un nom d'événement valide (minimum 3 caractères).")
      return
    }

    if (!description || description.trim().length < 10) {
      toast.error("Veuillez fournir une description détaillée d'au moins 10 caractères.")
      return
    }

    setLoading(true)

    try {
      const payload = {
        eventName: eventName.trim(),
        eventDate: eventDate ? new Date(eventDate).toISOString() : null,
        eventType,
        description: description.trim(),
        referenceImageBase64: refImageBase64,
        budget: budget ? parseFloat(budget) : null,
      }

      const response = await fetch("/api/custom-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Votre commande a été soumise avec succès !")
        router.push("/dashboard/custom-orders")
        router.refresh()
      } else {
        toast.error(data.error || "Une erreur est survenue lors de la soumission.")
      }
    } catch (err) {
      console.error("Error creating custom order:", err)
      toast.error("Impossible d'enregistrer votre commande.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto px-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/custom-orders">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle commande sur-mesure</h1>
          <p className="text-xs text-muted-foreground">
            Décrivez précisément vos attentes pour que notre graphiste conçoive le cadre idéal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-primary" />
              Détails du projet
            </CardTitle>
            <CardDescription>
              Veuillez remplir le formulaire ci-dessous avec le plus de précisions possibles.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventName">Nom de l'événement *</Label>
                <Input
                  id="eventName"
                  placeholder="ex: Anniversaire de Chloé - 10 ans"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Date de l'événement (optionnel)</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventType">Type d'événement</Label>
                <select
                  id="eventType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  disabled={loading}
                >
                  <option value="birthday">Anniversaire</option>
                  <option value="wedding">Mariage</option>
                  <option value="holiday">Vacances / Fête</option>
                  <option value="graduation">Remise de diplôme</option>
                  <option value="corporate">Entreprise</option>
                  <option value="social">Réseaux Sociaux</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget indicatif (XOF, optionnel)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="ex: 15000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={loading}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instructions et Description détaillée *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez le thème, les couleurs souhaitées, les textes exacts à faire figurer sur le cadre (ex: 'Joyeux Anniversaire Chloé'), le style graphique général..."
                className="min-h-[150px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Image de référence / Style d'inspiration (optionnel)</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/5 hover:bg-muted/10 transition-colors relative">
                <Input
                  id="refImage"
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleImageChange}
                  disabled={loading}
                />
                <div className="flex flex-col items-center text-center space-y-2 pointer-events-none">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {refImageFile ? refImageFile.name : "Cliquez ou glissez une image"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP jusqu'à 5 Mo
                  </span>
                </div>
              </div>

              {imagePreview && (
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-xs font-semibold text-muted-foreground mb-1">Aperçu de l'inspiration :</span>
                  <div className="relative border rounded-lg overflow-hidden h-36 w-36 bg-black flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Aperçu inspiration"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/10 p-6 flex flex-col sm:flex-row justify-end gap-3">
            <Link href="/dashboard/custom-orders" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full" type="button" disabled={loading}>
                Annuler
              </Button>
            </Link>
            <Button className="w-full sm:w-auto" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Soumettre ma commande"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
