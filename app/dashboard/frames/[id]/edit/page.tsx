"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

function optimizePngToSafePayload(img: HTMLImageElement, initialMaxDim = 2048): string {
  let maxDim = initialMaxDim
  let result = ""

  for (let attempt = 0; attempt < 3; attempt++) {
    let width = img.naturalWidth || img.width
    let height = img.naturalHeight || img.height

    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) break

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    result = canvas.toDataURL("image/png")

    // Keep payload well below Vercel's 4.5 MB request body limit
    if (result.length < 4 * 1024 * 1024 || maxDim <= 1200) {
      break
    }
    maxDim = Math.round(maxDim * 0.75)
  }

  return result
}

export default function EditFramePage() {
  const router = useRouter()
  const params = useParams()
  const frameId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isActive, setIsActive] = useState(true)
  
  // Loading & saving states
  const [isLoadingFrame, setIsLoadingFrame] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  
  // Image states
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [base64Image, setBase64Image] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Options states
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCats, setIsLoadingCats] = useState(true)

  // 1. Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name")
        if (data && !error) {
          setCategories(data)
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
      } finally {
        setIsLoadingCats(false)
      }
    }
    fetchCategories()
  }, [supabase])

  // 2. Fetch existing frame data
  useEffect(() => {
    if (!frameId) return

    async function fetchFrame() {
      setIsLoadingFrame(true)
      try {
        const res = await fetch(`/api/frames?id=${encodeURIComponent(frameId)}`)
        const data = await res.json()

        if (res.ok && data.success && data.frame) {
          const frame = data.frame
          setName(frame.name || "")
          setDescription(frame.description || "")
          setCategoryId(frame.category_id || "")
          setTagsInput(Array.isArray(frame.tags) ? frame.tags.join(", ") : "")
          setIsPublic(frame.is_public !== undefined ? frame.is_public : true)
          setIsActive(frame.is_active !== undefined ? frame.is_active : true)
          setExistingImageUrl(frame.image_url || frame.thumbnail_url || null)
        } else {
          toast.error(data.error || "Impossible de charger ce cadre.")
          router.push("/dashboard/frames")
        }
      } catch (err) {
        console.error("Error fetching frame to edit:", err)
        toast.error("Erreur lors du chargement du cadre.")
      } finally {
        setIsLoadingFrame(false)
      }
    }

    fetchFrame()
  }, [frameId, router])

  // File drop/upload handlers for replacing image
  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== "image/png") {
      toast.error("Format invalide. Seuls les fichiers PNG transparents sont acceptés.")
      return
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("Le fichier est trop lourd. Limite max : 20 Mo.")
      return
    }

    const url = URL.createObjectURL(selectedFile)
    setNewImagePreview(url)
    setIsProcessingImage(true)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const MAX_DIM = 2048
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height

        if (width > MAX_DIM || height > MAX_DIM || selectedFile.size > 2.5 * 1024 * 1024) {
          const optimized = optimizePngToSafePayload(img, MAX_DIM)
          if (optimized) {
            setBase64Image(optimized)
            setIsProcessingImage(false)
            return
          }
        }

        const reader = new FileReader()
        reader.onloadend = () => {
          setBase64Image(reader.result as string)
          setIsProcessingImage(false)
        }
        reader.readAsDataURL(selectedFile)
      } catch (err) {
        console.error("Error optimizing frame PNG:", err)
        const reader = new FileReader()
        reader.onloadend = () => {
          setBase64Image(reader.result as string)
          setIsProcessingImage(false)
        }
        reader.readAsDataURL(selectedFile)
      }
    }

    img.onerror = () => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBase64Image(reader.result as string)
        setIsProcessingImage(false)
      }
      reader.readAsDataURL(selectedFile)
    }

    img.src = url
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Le titre du frame est requis.")
      return
    }

    if (isProcessingImage) {
      toast.info("Optimisation de la nouvelle image en cours, veuillez patienter un instant...")
      return
    }

    if (!categoryId) {
      toast.error("Veuillez sélectionner une catégorie.")
      return
    }

    setIsSaving(true)

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    try {
      const payload: Record<string, any> = {
        id: frameId,
        name: name.trim(),
        description: description.trim() || null,
        categoryId,
        tags,
        isPublic,
        isActive,
      }

      if (base64Image) {
        payload.base64Image = base64Image
      }

      const res = await fetch("/api/frames", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      let data: any
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await res.json()
      } else {
        const text = await res.text()
        if (res.status === 413 || text.includes("Request Entity Too Large") || text.includes("FUNCTION_PAYLOAD_TOO_LARGE")) {
          throw new Error("L'image est trop volumineuse pour être envoyée (dépasse la limite de 4.5 Mo de Vercel).")
        }
        throw new Error(text || `Erreur serveur (${res.status})`)
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Une erreur est survenue lors de la mise à jour.")
      }

      toast.success("Cadre modifié avec succès !")
      router.push("/dashboard/frames")
      router.refresh()
    } catch (err: any) {
      console.error("Update frame error:", err)
      toast.error(err.message || "Erreur lors de la modification du cadre.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingFrame) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement des détails du cadre...</p>
      </div>
    )
  }

  const activeDisplayImage = newImagePreview || existingImageUrl

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/frames">
          <Button variant="ghost" size="sm" className="gap-1 p-0 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le Frame</h1>
          <p className="text-muted-foreground text-sm">
            Mettez à jour les informations, la catégorie ou l&apos;image de ce cadre
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="grid gap-6 md:grid-cols-3">
        {/* Left side inputs */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Informations de base</CardTitle>
              <CardDescription>Modifiez les informations et la visibilité de votre cadre.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Catégorie *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoadingCats}>
                  <SelectTrigger className="border-input bg-transparent text-foreground">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} {cat.icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Titre du frame *</Label>
                <Input
                  id="title"
                  placeholder="Entrer le titre du frame"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-input bg-transparent text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre cadre (événement associé, conseils, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[140px] border-input bg-transparent text-foreground placeholder:text-muted-foreground resize-y"
                  required
                />
              </div>

              {/* Keywords / Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-foreground">Mots clés</Label>
                <Input
                  id="tags"
                  placeholder="anniversaire, fête, mariage (séparés par des virgules)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="border-input bg-transparent text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side file upload & actions */}
        <div className="space-y-6">
          {/* File Upload card */}
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Image du frame</CardTitle>
              <CardDescription>
                {newImagePreview ? "Nouvelle image sélectionnée" : "Image actuelle du cadre"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer min-h-[220px] transition-all relative overflow-hidden ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : activeDisplayImage
                    ? "border-muted-foreground/30 bg-muted/20"
                    : "border-muted-foreground/30 bg-muted/10 hover:border-muted-foreground/50 hover:bg-muted/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png"
                  className="hidden"
                />

                {activeDisplayImage ? (
                  <div className="absolute inset-0 flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-950">
                    <img
                      src={activeDisplayImage}
                      alt="Cadre"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary" type="button">
                        Remplacer le PNG
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Glissez-déposez un fichier ici ou cliquez</p>
                      <p className="text-xs text-muted-foreground mt-1">Format PNG transparent uniquement</p>
                    </div>
                  </div>
                )}
              </div>

              {/* PNG Transparency Warning */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-400 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Si vous remplacez l&apos;image, veillez à utiliser un fichier PNG avec une découpe transparente.
                </p>
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between border-t pt-4 border-border">
                <div className="space-y-0.5">
                  <Label htmlFor="visibility" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    {isPublic ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    Rendre public
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? "Visible dans la galerie publique." : "Accessible uniquement via lien de partage direct."}
                  </p>
                </div>
                <Switch
                  id="visibility"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between border-t pt-4 border-border">
                <div className="space-y-0.5">
                  <Label htmlFor="activeStatus" className="text-sm font-medium text-foreground">
                    Cadre actif
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Désactivez pour masquer temporairement ce cadre.
                  </p>
                </div>
                <Switch
                  id="activeStatus"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action buttons card */}
          <Card className="border-border bg-card text-card-foreground p-4 space-y-3">
            <Button
              type="submit"
              className="w-full gap-2 text-white bg-primary hover:bg-primary/90"
              disabled={isSaving || isProcessingImage}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
            <Link href="/dashboard/frames" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full text-foreground border-input bg-transparent hover:bg-muted"
                disabled={isSaving}
              >
                Annuler
              </Button>
            </Link>
          </Card>
        </div>
      </form>
    </div>
  )
}

