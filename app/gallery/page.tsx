import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { GalleryContent } from "@/components/gallery/gallery-content"
import { GallerySkeleton } from "@/components/gallery/gallery-skeleton"

export const metadata = {
  title: "Frame Gallery",
  description: "Browse hundreds of beautiful frame templates for every occasion.",
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
