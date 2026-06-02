import { useState, useCallback, useEffect } from "react"
import * as fabric from "fabric"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function useAiGeneration(
  session: any,
  fabricRef: React.MutableRefObject<fabric.Canvas | null>,
  saveState: () => void,
  t: any,
  CANVAS_SIZE: number
) {
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiNegativePrompt, setAiNegativePrompt] = useState("")
  const [aiStyle, setAiStyle] = useState("standard")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiCredits, setAiCredits] = useState<number | null>(null)
  const [aiCreditsTotal, setAiCreditsTotal] = useState<number | null>(null)

  const fetchCredits = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch("/api/user/credits")
      const data = await res.json()

      if (data.success && data.credits) {
        setAiCredits(data.credits.total_credits - data.credits.used_credits)
        setAiCreditsTotal(data.credits.total_credits)
      } else {
        setAiCredits(5)
        setAiCreditsTotal(5)
      }
    } catch (err) {
      console.error("Error fetching AI credits:", err)
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return

    fetchCredits()

    const supabase = createClient()
    const channel = supabase
      .channel(`ai-credits-user-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_credits",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload: any) => {
          console.log("Realtime AI credits update:", payload)
          const newCredits = payload.new as any
          setAiCredits(newCredits.total_credits - newCredits.used_credits)
          setAiCreditsTotal(newCredits.total_credits)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, fetchCredits])

  const handleAIGenerate = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error(t("editor.toast.signInSave"))
      return
    }

    if (!aiPrompt.trim()) {
      toast.error(t("editor.aiPrompt"))
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          negativePrompt: aiNegativePrompt,
          style: aiStyle
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || t("editor.aiError"))
        setIsGenerating(false)
        return
      }

      const { predictionId, generationId } = data
      
      if (data.remainingCredits !== undefined) {
        setAiCredits(data.remainingCredits)
      }

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/ai/status?id=${predictionId}&genId=${generationId}`)
          const statusData = await statusRes.json()

          if (!statusRes.ok || !statusData.success) {
            clearInterval(pollInterval)
            toast.error(t("editor.aiError"))
            setIsGenerating(false)
            fetchCredits()
            return
          }

          if (statusData.status === "succeeded") {
            clearInterval(pollInterval)
            
            if (statusData.imageUrl) {
              const imgElement = document.createElement("img")
              imgElement.crossOrigin = "anonymous"
              imgElement.src = statusData.imageUrl
              imgElement.onload = () => {
                if (!fabricRef.current) return

                const objects = fabricRef.current.getObjects()
                const existingPhotos = objects.filter(
                  (obj: any) => (obj.type === "image" || obj instanceof fabric.FabricImage) && !obj.isFrame
                )
                existingPhotos.forEach((photo) => fabricRef.current?.remove(photo))

                const canvasWidth = fabricRef.current.width || CANVAS_SIZE
                const canvasHeight = fabricRef.current.height || CANVAS_SIZE

                const img = new fabric.FabricImage(imgElement, {
                  left: canvasWidth / 2,
                  top: canvasHeight / 2,
                  originX: "center",
                  originY: "center",
                  crossOrigin: "anonymous"
                })

                const scale = Math.max(
                  canvasWidth / imgElement.width,
                  canvasHeight / imgElement.height
                )
                img.scale(scale)

                fabricRef.current.add(img)
                fabricRef.current.sendObjectToBack(img)
                fabricRef.current.setActiveObject(img)
                fabricRef.current.renderAll()
                saveState()
                toast.success(t("editor.toast.aiPhotoAdded"))
              }
            }

            setIsGenerating(false)
            fetchCredits()
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval)
            toast.error(statusData.error || t("editor.aiError"))
            setIsGenerating(false)
            fetchCredits()
          }
        } catch (err) {
          console.error("Error polling AI status:", err)
        }
      }, 1500)

    } catch (err) {
      console.error("AI Generation error:", err)
      toast.error(t("editor.aiError"))
      setIsGenerating(false)
      fetchCredits()
    }
  }, [session, aiPrompt, aiNegativePrompt, aiStyle, fetchCredits, saveState, t, fabricRef, CANVAS_SIZE])

  return {
    aiPrompt,
    setAiPrompt,
    aiNegativePrompt,
    setAiNegativePrompt,
    aiStyle,
    setAiStyle,
    isGenerating,
    aiCredits,
    aiCreditsTotal,
    handleAIGenerate
  }
}
