export function GallerySkeleton() {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded-lg mt-2" />
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted animate-pulse rounded-lg" />
            <div className="w-[180px] h-10 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
