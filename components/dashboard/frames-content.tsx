"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreVertical, Heart, Download, Trash2, Eye, EyeOff, Layers } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"

interface FrameItem {
  id: string
  name: string
  description: string | null
  image_url: string
  thumbnail_url: string | null
  is_public: boolean
  is_premium: boolean
  like_count: number
  download_count: number
  created_at: string
  category?: { name: string } | null
}

interface FramesContentProps {
  frames: FrameItem[]
}

export function FramesContent({ frames: initialFrames }: FramesContentProps) {
  const { t } = useI18n()
  const [frames, setFrames] = useState<FrameItem[]>(initialFrames)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleDeleteFrame = async (frameId: string, frameName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le cadre "${frameName}" ?`)) return

    setIsDeleting(frameId)
    try {
      const { error } = await supabase
        .from("frames")
        .delete()
        .eq("id", frameId)

      if (error) throw error

      setFrames((prev) => prev.filter((f) => f.id !== frameId))
      toast.success("Cadre supprimé avec succès.")
    } catch (err) {
      console.error("Error deleting frame:", err)
      toast.error("Impossible de supprimer le cadre.")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Frames</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos modèles de cadres photo personnalisés
          </p>
        </div>
        <Link href="/dashboard/frames/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Créer un Frame
          </Button>
        </Link>
      </div>

      {frames && frames.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {frames.map((frame) => (
            <Card key={frame.id} className="overflow-hidden group flex flex-col justify-between">
              <div className="aspect-square bg-slate-900 border-b relative flex items-center justify-center overflow-hidden">
                {frame.image_url ? (
                  <img
                    src={frame.image_url}
                    alt={frame.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Layers className="w-12 h-12 text-muted-foreground" />
                )}
                
                {/* Visibility Badge */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {frame.is_public ? (
                    <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-500/90 border-0 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-700/90 text-white hover:bg-slate-700/90 border-0 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Privé
                    </Badge>
                  )}
                  {frame.category && (
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-slate-700">
                      {frame.category.name}
                    </Badge>
                  )}
                </div>

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/50 group-hover:opacity-100 opacity-0 transition-opacity flex items-center justify-center gap-2">
                  <Link href={`/editor?frame=${frame.id}`}>
                    <Button size="sm" className="gap-1">
                      Utiliser
                    </Button>
                  </Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-background"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/editor?frame=${frame.id}`}>
                        Utiliser dans l'éditeur
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteFrame(frame.id, frame.name)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      disabled={isDeleting === frame.id}
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{frame.name}</h3>
                  {frame.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {frame.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      {frame.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-sky-500" />
                      {frame.download_count || 0}
                    </span>
                  </div>
                  <span>{new Date(frame.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Layers className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Aucun cadre pour le moment</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Importez vos propres designs de cadres (au format PNG transparent) pour permettre aux utilisateurs d'y insérer leurs photos.
            </p>
            <Link href="/dashboard/frames/create">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Créer votre premier cadre
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
