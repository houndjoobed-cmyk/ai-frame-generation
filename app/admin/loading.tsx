"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default function AdminLoading() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-pulse">
      {/* Admin Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Admin Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-6 bg-card space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Admin Table Mock */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between border-b pb-3 font-medium text-xs text-muted-foreground">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/12" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex items-center gap-3 w-1/4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Loading overlay spinner */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background border shadow-md px-3 py-1.5 rounded-full text-xs text-muted-foreground">
        <Spinner className="h-3 w-3 text-primary" />
        <span>Chargement de la console d'administration...</span>
      </div>
    </div>
  )
}
