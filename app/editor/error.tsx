"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Editor error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            Erreur de l&apos;éditeur
          </h2>
          <p className="text-muted-foreground font-light">
            L&apos;éditeur de cadres a rencontré un problème inattendu.
            Vos modifications récentes ont peut-être été perdues.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-2">
              Code: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="rounded-full font-bold"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Retour au tableau de bord
          </Button>
          <Button
            className="rounded-full font-bold"
            onClick={reset}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    </div>
  )
}
