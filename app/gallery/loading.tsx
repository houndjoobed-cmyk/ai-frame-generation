"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default function GalleryLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-pulse">
      {/* Header section */}
      <div className="space-y-3 text-center max-w-xl mx-auto">
        <Skeleton className="h-10 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
      </div>

      {/* Filter tabs/bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Grid of templates */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-xl bg-card overflow-hidden space-y-3 pb-4">
            {/* Template image container */}
            <Skeleton className="aspect-square w-full" />
            
            {/* Title & category */}
            <div className="px-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pt-2 flex items-center justify-between border-t border-muted/50">
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Load more spinner */}
      <div className="flex justify-center pt-8">
        <div className="flex items-center gap-2 bg-background border px-4 py-2 rounded-full text-sm text-muted-foreground shadow-sm">
          <Spinner className="h-4 w-4" />
          <span>Chargement des cadres...</span>
        </div>
      </div>
    </div>
  )
}
