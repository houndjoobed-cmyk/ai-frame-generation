"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin console error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight mb-2">Erreur système d'administration</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Une erreur s'est produite lors de la connexion aux services d'administration ou au traitement des requêtes.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button 
          onClick={() => reset()}
          className="flex-1 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </Button>
        <Link href="/dashboard" className="flex-1" passHref>
          <Button variant="outline" className="w-full gap-2">
            <Home className="h-4 w-4" />
            Tableau de bord
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
