"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowRight } from "lucide-react"
import { FrameCard } from "@/components/gallery/frame-card"
import { useI18n } from "@/lib/i18n/i18n-context"
import type { Frame } from "@/lib/types"

interface LikedFrame {
  id: string
  frame: Frame | null
}

interface LikedContentProps {
  likedFrames: LikedFrame[]
}

export function LikedContent({ likedFrames }: LikedContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("liked.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("liked.subtitle")}
        </p>
      </div>

      {likedFrames && likedFrames.length > 0 ? (
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {likedFrames.map((like) => {
            const frame = like.frame
            if (!frame) return null

            const mappedFrame: Frame = {
              ...frame,
              is_liked: true,
            }

            return (
              <FrameCard key={like.id} frame={mappedFrame} />
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("liked.noLiked")}</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {t("liked.noLikedDesc")}
            </p>
            <Link href="/gallery">
              <Button size="lg" className="gap-2">
                {t("liked.browseGallery")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
