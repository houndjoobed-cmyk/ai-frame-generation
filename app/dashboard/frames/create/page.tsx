"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

export default function CreateFramePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // File states
  const [file, setFile] = useState<File | null>(null)
  const [base64Image, setBase64Image] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Options states
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCats, setIsLoadingCats] = useState(true)

  // Fetch categories on mount
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
  }, [])

  // File drop/upload handlers
  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== "image/png") {
      toast.error("Format invalide. Seuls les fichiers PNG transparents sont acceptés.")
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop lourd. Limite max : 5 Mo.")
      return
    }

    setFile(selectedFile)
    
    // Create preview
    const url = URL.createObjectURL(selectedFile)
    setImagePreview(url)

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setBase64Image(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
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

  const handleFormSubmit = async (e: React.FormEvent, activeStatus = true) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Le titre du frame est requis.")
      return
    }

    if (!base64Image) {
      toast.error("Veuillez charger une image au format PNG.")
      return
    }

    if (!categoryId) {
      toast.error("Veuillez sélectionner une catégorie.")
      return
    }

    setIsSaving(true)

    // Process tags
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    try {
      const res = await fetch("/api/frames", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          categoryId,
          tags,
          base64Image,
          isPublic,
          isActive: activeStatus, // false if draft
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Une erreur est survenue.")
      }

      toast.success(
        activeStatus
          ? "Cadre créé et publié avec succès !"
          : "Cadre enregistré comme brouillon."
      )
      router.push("/dashboard/frames")
      router.refresh()
    } catch (err: any) {
      console.error("Submit error:", err)
      toast.error(err.message || "Erreur lors de la création du cadre.")
    } finally {
      setIsSaving(false)
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Créer un Frame</h1>
          <p className="text-muted-foreground text-sm">
            Importez un nouveau cadre photo pour les utilisateurs de la plateforme
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleFormSubmit(e, true)} className="grid gap-6 md:grid-cols-3">
        {/* Left side inputs */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Informations de base</CardTitle>
              <CardDescription>Décrivez votre modèle de cadre et choisissez sa catégorie.</CardDescription>
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
                <Label htmlFor="tags" className="text-foreground">Mots clés *</Label>
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
              <CardTitle className="text-foreground">Image du frame *</CardTitle>
              <CardDescription>
                Glissez votre overlay transparent ici. Format PNG requis.
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
                    : imagePreview
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

                {imagePreview ? (
                  <div className="absolute inset-0 flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-950">
                    <img
                      src={imagePreview}
                      alt="Cadre importé"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary" type="button">
                        Remplacer l'image
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
                      <p className="text-xs text-muted-foreground mt-1">Format PNG uniquement (Transparent)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* PNG Transparency Warning */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-400 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Assurez-vous que l'image possède une découpe transparente (fond transparent) pour que les photos des utilisateurs puissent apparaître en arrière-plan.
                </p>
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between border-t pt-4 border-border">
                <div className="space-y-0.5">
                  <Label htmlFor="visibility" className="text-sm font-medium text-foreground">Rendre public</Label>
                  <p className="text-xs text-muted-foreground">Visible par tout le monde dans la galerie.</p>
                </div>
                <Switch
                  id="visibility"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action buttons card */}
          <Card className="border-border bg-card text-card-foreground p-4 space-y-3">
            <Button
              type="submit"
              className="w-full gap-2 text-white bg-primary hover:bg-primary/90"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer le frame
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-foreground border-input bg-transparent hover:bg-muted"
              onClick={(e) => handleFormSubmit(e, false)}
              disabled={isSaving}
            >
              Enregistrer comme brouillon
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
