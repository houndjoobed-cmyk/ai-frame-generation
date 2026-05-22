"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

interface LikedContentProps {
  likedFrames: any[]
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likedFrames.map((like) => {
            const frame = like.frame as {
              id: string
              name: string
              thumbnail_url: string | null
              image_url: string
              category: { name: string } | null
            } | null

            if (!frame) return null

            return (
              <Card key={like.id} className="overflow-hidden group">
                <div className="aspect-square bg-muted relative">
                  {frame.thumbnail_url || frame.image_url ? (
                    <img
                      src={frame.thumbnail_url || frame.image_url}
                      alt={frame.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Link href={`/editor?frame=${frame.id}`}>
                      <Button size="sm">{t("liked.useFrame")}</Button>
                    </Link>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{frame.name}</h3>
                  {frame.category && (
                    <p className="text-sm text-muted-foreground">
                      {frame.category.name}
                    </p>
                  )}
                </CardContent>
              </Card>
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
