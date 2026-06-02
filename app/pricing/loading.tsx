"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default function PricingLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16 md:py-24 space-y-12 animate-pulse">
      {/* Title & subtitle */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <Skeleton className="h-10 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
      </div>

      {/* Pricing Toggle (Annual/Monthly) */}
      <div className="flex justify-center">
        <Skeleton className="h-11 w-64 rounded-full" />
      </div>

      {/* Grid of plans */}
      <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`border rounded-2xl p-8 bg-card flex flex-col justify-between space-y-6 shadow-sm ${i === 1 ? 'border-primary/50 relative' : ''}`}>
            {i === 1 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            )}
            
            {/* Header info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
              
              {/* Price */}
              <div className="flex items-baseline gap-1 py-4">
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>

            {/* Plan features */}
            <div className="space-y-3 flex-1">
              {Array.from({ length: 6 }).map((_, k) => (
                <div key={k} className="flex items-center gap-3 py-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>

            {/* Plan action button */}
            <Skeleton className="h-11 w-full rounded-md mt-6" />
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8">
        <Spinner className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  )
}
