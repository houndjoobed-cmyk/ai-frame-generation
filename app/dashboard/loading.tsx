"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-pulse">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-6 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Main content split */}
      <div className="grid gap-6 md:grid-cols-6 lg:grid-cols-8">
        {/* Large container */}
        <div className="border rounded-xl p-6 bg-card md:col-span-4 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Small container */}
        <div className="border rounded-xl p-6 bg-card md:col-span-2 lg:col-span-3 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Loading overlay spinner */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background border shadow-md px-3 py-1.5 rounded-full text-xs text-muted-foreground">
        <Spinner className="h-3 w-3" />
        <span>Chargement du tableau de bord...</span>
      </div>
    </div>
  )
}
