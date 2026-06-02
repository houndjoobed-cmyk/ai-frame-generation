"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function GalleryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Gallery page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight mb-2">Impossible de charger la galerie</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Une erreur est survenue lors de la récupération des cadres photo. Veuillez vérifier votre connexion et réessayer.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button 
          onClick={() => reset()}
          className="flex-1 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </Button>
        <Link href="/" className="flex-1" passHref>
          <Button variant="outline" className="w-full gap-2">
            <Home className="h-4 w-4" />
            Accueil
          </Button>
        </Link>
      </div>
      
      {error.digest && (
        <span className="mt-8 text-xs text-muted-foreground font-mono">
          ID d'erreur: {error.digest}
        </span>
      )}
    </div>
  )
}
