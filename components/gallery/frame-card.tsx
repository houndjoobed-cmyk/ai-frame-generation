"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Frame } from "@/lib/types"
import { Heart, Download, ExternalLink, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface FrameCardProps {
  frame: Frame
}

export function FrameCard({ frame }: FrameCardProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(frame.is_liked || false)
  const [likesCount, setLikesCount] = useState(frame.likes_count || 0)

  async function handleLike() {
    if (!session?.user) {
      toast.error("Please sign in to like frames")
      return
    }

    try {
      if (isLiked) {
        const res = await fetch(`/api/likes?frameId=${frame.id}`, {
          method: "DELETE",
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error()

        setIsLiked(false)
        setLikesCount((c) => c - 1)
      } else {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frameId: frame.id }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error()

        setIsLiked(true)
        setLikesCount((c) => c + 1)
      }
    } catch {
      toast.error("Failed to update like")
    }
  }

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {frame.thumbnail_url || frame.image_url ? (
          <Image
            src={frame.thumbnail_url || frame.image_url}
            alt={frame.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{frame.name}</span>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Link href={`/editor?frame=${frame.id}`}>
              <Button size="sm" className="gap-1">
                <ExternalLink className="w-4 h-4" />
                Use Frame
              </Button>
            </Link>
          </div>
        </div>

        {/* Premium badge */}
        {frame.is_premium && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-950">
            Premium
          </Badge>
        )}

        {/* Category badge */}
        {frame.category && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            {frame.category.name}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{frame.name}</h3>
            {frame.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {frame.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 hover:text-primary transition-colors ${
                isLiked ? "text-red-500" : ""
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {frame.download_count}
            </span>
          </div>
          <Link href={`/editor?frame=${frame.id}`}>
            <Button variant="ghost" size="sm">
              Use
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
