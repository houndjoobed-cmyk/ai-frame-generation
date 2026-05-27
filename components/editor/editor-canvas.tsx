"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import * as fabric from "fabric"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import type { Frame, Category } from "@/lib/types"
import { toast } from "sonner"
import {
  Download,
  Save,
  ChevronLeft,
  Share2,
  Check,
  Copy,
  Loader2,
  Layers,
  Frame as FrameIcon,
  Sliders
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

import { useCanvas } from "@/hooks/editor/use-canvas"
import { useHistory } from "@/hooks/editor/use-history"
import { useSelection } from "@/hooks/editor/use-selection"
import { useLayers } from "@/hooks/editor/use-layers"
import { useAiGeneration } from "@/hooks/editor/use-ai-generation"

import { EditorToolbar } from "./editor-toolbar"
import { EditorSidebar } from "./editor-sidebar"
import { EditorProperties } from "./editor-properties"

const CANVAS_SIZE = 800
const EXPORT_SIZES = [
  { label: "Instagram Post (1080x1080)", width: 1080, height: 1080 },
  { label: "Instagram Story (1080x1920)", width: 1080, height: 1920 },
  { label: "Facebook Post (1200x630)", width: 1200, height: 630 },
  { label: "Twitter Post (1200x675)", width: 1200, height: 675 },
  { label: "HD (1920x1080)", width: 1920, height: 1080 },
  { label: "4K (3840x2160)", width: 3840, height: 2160 },
]

const CUSTOM_PROPS = [
  "isFrame",
  "selectable",
  "evented",
  "lockMovementX",
  "lockMovementY",
  "lockScalingX",
  "lockScalingY",
  "lockRotation",
  "hasControls",
  "hasBorders",
  "crossOrigin"
]

export function EditorCanvas() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const frameId = searchParams.get("frame")
  const { t } = useI18n()

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [frames, setFrames] = useState<Frame[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [projectName, setProjectName] = useState(t("editor.untitled"))
  const [isSaving, setIsSaving] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [activeMobileTab, setActiveMobileTab] = useState<"sidebar" | "editor" | "properties">("editor")
  const [isSharing, setIsSharing] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [exportSize, setExportSize] = useState(EXPORT_SIZES[0])
  const [textOptions, setTextOptions] = useState({
    text: "Your Text",
    fontSize: 48,
    fontFamily: "Arial",
    fill: "#000000",
  })

  // 1. Canvas state
  const {
    canvasContainerRef,
    fabricRef,
    isTrackingRef,
    canvasReady,
    zoom,
    canvasWidth,
    canvasHeight,
    updateDimensions,
    enforceFrameProperties,
    handleZoom,
    resetCanvas,
    autoCropToFrame,
    addText
  } = useCanvas(CANVAS_SIZE)

  // 2. History state
  const {
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    initHistory
  } = useHistory(fabricRef, isTrackingRef, CUSTOM_PROPS, enforceFrameProperties)

  // 3. Selection state
  const {
    selectedObject,
    selectedObjectScale,
    selectedObjectAngle,
    handleScaleChange,
    handleAngleChange,
    deleteSelected,
    duplicateSelected,
    flipHorizontal,
    flipVertical
  } = useSelection(fabricRef, saveState)

  // 4. Layers state
  const {
    bringForward,
    sendBackward
  } = useLayers(fabricRef, saveState, enforceFrameProperties)

  // 5. AI Generation state
  const {
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
  } = useAiGeneration(session, fabricRef, saveState, t, CANVAS_SIZE)

  // Fit canvas to screen on mobile / initial load
  useEffect(() => {
    if (!canvasContainerRef.current) return

    const handleResize = () => {
      if (!fabricRef.current || !canvasContainerRef.current) return
      
      const parent = canvasContainerRef.current.parentElement?.parentElement
      if (!parent) return

      const parentWidth = parent.clientWidth
      const currentWidth = fabricRef.current.width || CANVAS_SIZE

      // Only auto-fit on mobile screens (width < 768px)
      if (window.innerWidth < 768) {
        const availableWidth = parentWidth - 32
        const fitZoom = Math.min(100, Math.floor((availableWidth / currentWidth) * 100))
        handleZoom(fitZoom)
      }
    }

    if (canvasReady) {
      const timer = setTimeout(handleResize, 150)
      window.addEventListener("resize", handleResize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [canvasReady, fabricRef, CANVAS_SIZE, handleZoom, canvasWidth])

  // Automatically switch tabs when an object is selected on mobile
  useEffect(() => {
    if (selectedObject) {
      setActiveMobileTab("properties")
    }
  }, [selectedObject])

  const handleBackToEditor = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.discardActiveObject()
      fabricRef.current.renderAll()
    }
    setActiveMobileTab("editor")
  }, [fabricRef])

  // Load existing project
  useEffect(() => {
    const projectId = searchParams.get("project")
    if (!projectId || !session?.user?.id || !canvasReady) return

    let active = true

    async function loadProject() {
      try {
        const res = await fetch(`/api/projects?id=${projectId}`)
        const data = await res.json()
        
        if (!active) return

        if (res.ok && data.success && data.project) {
          const project = data.project
          setProjectName(project.name)
          setCurrentProjectId(project.id)
          
          if (project.canvas_data && fabricRef.current) {
            const canvas = fabricRef.current
            if (!canvas.getContext()) return

            isTrackingRef.current = false
            
            const width = project.canvas_width || (project.canvas_data as any).width || CANVAS_SIZE
            const height = project.canvas_height || (project.canvas_data as any).height || CANVAS_SIZE
            updateDimensions(width, height)

            await canvas.loadFromJSON(project.canvas_data)
            enforceFrameProperties(canvas)
            canvas.renderAll()
            isTrackingRef.current = true
            
            const loadedJson = JSON.stringify((canvas as any).toJSON(CUSTOM_PROPS))
            initHistory(loadedJson)
          }
        } else {
          toast.error(t("editor.toast.loadFailed"))
        }
      } catch (err) {
        if (active) {
          console.error("Error loading project:", err)
          toast.error(t("editor.toast.loadFailed"))
        }
      }
    }

    loadProject()
    return () => { active = false }
  }, [searchParams, session, canvasReady, t, initHistory, enforceFrameProperties, fabricRef, isTrackingRef])

  const addFrameToCanvas = useCallback(async (imageUrl: string) => {
    if (!fabricRef.current) return

    try {
      const objects = fabricRef.current.getObjects()
      const existingFrame = objects.find((obj) => (obj as any).isFrame)
      if (existingFrame) {
        fabricRef.current.remove(existingFrame)
      }

      const imgElement = document.createElement("img")
      imgElement.crossOrigin = "anonymous"
      
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve
        imgElement.onerror = reject
        imgElement.src = imageUrl
      })

      const frameWidth = imgElement.width
      const frameHeight = imgElement.height
      const oldWidth = fabricRef.current.width || CANVAS_SIZE
      const oldHeight = fabricRef.current.height || CANVAS_SIZE

      let newWidth = CANVAS_SIZE
      let newHeight = CANVAS_SIZE

      if (frameWidth >= frameHeight) {
        newWidth = CANVAS_SIZE
        newHeight = Math.round(CANVAS_SIZE * (frameHeight / frameWidth))
      } else {
        newHeight = CANVAS_SIZE
        newWidth = Math.round(CANVAS_SIZE * (frameWidth / frameHeight))
      }

      updateDimensions(newWidth, newHeight)

      const offsetX = (newWidth - oldWidth) / 2
      const offsetY = (newHeight - oldHeight) / 2

      const otherObjects = fabricRef.current.getObjects()
      otherObjects.forEach((obj) => {
        obj.set({
          left: (obj.left || 0) + offsetX,
          top: (obj.top || 0) + offsetY,
        })
        obj.setCoords()
      })

      const img = new fabric.FabricImage(imgElement, {
        left: newWidth / 2,
        top: newHeight / 2,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasControls: false,
        hasBorders: false,
        crossOrigin: "anonymous"
      })
      ;(img as any).isFrame = true

      const scale = newWidth / frameWidth
      img.scale(scale)

      fabricRef.current.add(img)
      fabricRef.current.bringObjectToFront(img)
      fabricRef.current.renderAll()
      saveState()
      toast.success(t("editor.toast.frameAdded"))
      setActiveMobileTab("editor")
    } catch (err) {
      console.error("Frame loading failed:", err)
      toast.error(t("editor.toast.frameFailed"))
    }
  }, [fabricRef, saveState, t])

  // Fetch frames and categories
  useEffect(() => {
    async function fetchData() {
      const [framesRes, categoriesRes] = await Promise.all([
        supabase
          .from("frames")
          .select("*, category:categories(*)")
          .eq("is_active", true)
          .order("download_count", { ascending: false })
          .limit(50),
        supabase.from("categories").select("*").order("name"),
      ])

      if (framesRes.data) setFrames(framesRes.data as Frame[])
      if (categoriesRes.data) setCategories(categoriesRes.data)

      if (frameId && framesRes.data) {
        const frame = framesRes.data.find((f: any) => f.id === frameId)
        if (frame?.image_url) {
          addFrameToCanvas(frame.image_url)
        }
      }
    }

    fetchData()
  }, [frameId, supabase, addFrameToCanvas])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imgElement = document.createElement("img")
      imgElement.crossOrigin = "anonymous"
      imgElement.src = event.target?.result as string
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
        toast.success(t("editor.toast.photoAdded"))
        setActiveMobileTab("editor")
      }
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [fabricRef, saveState, t])

  const exportCanvas = useCallback((format: "png" | "jpeg" = "png") => {
    if (!fabricRef.current) return
    const currentWidth = fabricRef.current.width || CANVAS_SIZE
    const currentHeight = fabricRef.current.height || CANVAS_SIZE
    
    let multiplier = 1
    if (exportSize) {
      if (currentWidth >= currentHeight) {
        multiplier = exportSize.width / currentWidth
      } else {
        multiplier = exportSize.height / currentHeight
      }
    }

    const originalZoom = fabricRef.current.getZoom()
    fabricRef.current.setZoom(1)

    try {
      const dataUrl = fabricRef.current.toDataURL({
        format,
        quality: 1,
        multiplier,
      })

      const link = document.createElement("a")
      link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.${format}`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(t("editor.toast.exportSuccess"))
    } catch (err) {
      console.error("Export error:", err)
      toast.error(t("editor.toast.exportError"))
    } finally {
      fabricRef.current.setZoom(originalZoom)
    }
  }, [projectName, exportSize, t, fabricRef])

  const saveProject = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error(t("editor.toast.signInSave"))
      return
    }

    if (!fabricRef.current) return

    setIsSaving(true)
    try {
      const canvasData = (fabricRef.current as any).toJSON(CUSTOM_PROPS)
      const dataUrl = fabricRef.current.toDataURL({
        format: "jpeg",
        quality: 0.8,
        multiplier: 0.5,
      })

      const base64Data = dataUrl.split(",")[1]
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob())
      
      const fileName = `${session.user.id}/${Date.now()}-thumbnail.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("projects")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("projects")
        .getPublicUrl(fileName)

      const payload = {
        name: projectName,
        user_id: session.user.id,
        canvas_data: canvasData,
        canvas_width: fabricRef.current.width || CANVAS_SIZE,
        canvas_height: fabricRef.current.height || CANVAS_SIZE,
        thumbnail_url: publicUrl,
        updated_at: new Date().toISOString()
      }

      let res
      if (currentProjectId) {
        res = await fetch(`/api/projects?id=${currentProjectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (res.ok && data.success) {
        if (!currentProjectId) {
          setCurrentProjectId(data.project.id)
          router.replace(`/editor?project=${data.project.id}`, { scroll: false })
        }
        toast.success(t("editor.toast.projectSaved"))
      } else {
        throw new Error(data.error || "Failed to save")
      }
    } catch (err) {
      console.error("Save error:", err)
      toast.error(t("editor.toast.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }, [session, projectName, currentProjectId, router, t, fabricRef, supabase.storage])

  const shareProject = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error(t("editor.toast.signInShare"))
      return
    }

    if (!fabricRef.current) return

    setIsSharing(true)
    try {
      const dataUrl = fabricRef.current.toDataURL({
        format: "jpeg",
        quality: 0.9,
        multiplier: 2,
      })

      const base64Data = dataUrl.split(",")[1]
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob())
      
      const fileName = `${session.user.id}/shares/${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("projects")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("projects")
        .getPublicUrl(fileName)

      const payload = {
        name: projectName,
        user_id: session.user.id,
        image_url: publicUrl,
        project_id: currentProjectId,
      }

      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setShareId(data.share.id)
        setCopiedShareLink(false)
        toast.success(t("editor.toast.shareCreated"))
      } else {
        throw new Error(data.error || "Failed to create share")
      }
    } catch (err) {
      console.error("Share error:", err)
      toast.error(t("editor.toast.shareFailed"))
    } finally {
      setIsSharing(false)
    }
  }, [session, projectName, currentProjectId, t, fabricRef, supabase.storage])

  const fitPhoto = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    if (!(selectedObject.type === "image" || selectedObject instanceof fabric.FabricImage)) return;
    
    const canvasWidth = fabricRef.current.width || CANVAS_SIZE;
    const canvasHeight = fabricRef.current.height || CANVAS_SIZE;
    
    const imgEl = (selectedObject as any).getElement();
    if (!imgEl) return;
    
    const scale = Math.min(
      canvasWidth / imgEl.width,
      canvasHeight / imgEl.height
    );
    
    selectedObject.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: "center",
      originY: "center"
    });
    
    selectedObject.setCoords();
    fabricRef.current.renderAll();
    saveState();
  }, [fabricRef, selectedObject, saveState])
  
  const fillPhoto = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    if (!(selectedObject.type === "image" || selectedObject instanceof fabric.FabricImage)) return;
    
    const canvasWidth = fabricRef.current.width || CANVAS_SIZE;
    const canvasHeight = fabricRef.current.height || CANVAS_SIZE;
    
    const imgEl = (selectedObject as any).getElement();
    if (!imgEl) return;
    
    const scale = Math.max(
      canvasWidth / imgEl.width,
      canvasHeight / imgEl.height
    );
    
    selectedObject.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: "center",
      originY: "center"
    });
    
    selectedObject.setCoords();
    fabricRef.current.renderAll();
    saveState();
  }, [fabricRef, selectedObject, saveState])

  const filteredFrames = selectedCategory === "all"
    ? frames
    : frames.filter((f) => f.category?.slug === selectedCategory)

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      <header className="h-16 border-b flex items-center justify-between px-3 sm:px-6 bg-card shrink-0 w-full overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-28 sm:w-64 font-semibold bg-transparent border-transparent hover:border-input focus:border-input text-sm sm:text-base truncate"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={saveProject} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">{t("editor.save")}</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={shareProject} disabled={isSharing}>
                {isSharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">Partager</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Partager votre création</DialogTitle>
                <DialogDescription>
                  Votre image est en cours de préparation pour être partagée.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {isSharing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Génération de l'image haute qualité...</p>
                  </div>
                ) : shareId ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        value={`${window.location.origin}/share/${shareId}`} 
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const url = `${window.location.origin}/share/${shareId}`
                          await navigator.clipboard.writeText(url)
                          setCopiedShareLink(true)
                          toast.success(t("editor.toast.shareSuccess"))
                        }}
                      >
                        {copiedShareLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Regardez ma création : ${window.location.origin}/share/${shareId}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 p-2 rounded-md bg-[#25D366] text-white hover:bg-[#20ba59] transition-colors text-xs font-semibold text-center"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/share/${shareId}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 p-2 rounded-md bg-[#1877F2] text-white hover:bg-[#156bec] transition-colors text-xs font-semibold text-center"
                      >
                        Facebook
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/share/${shareId}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 p-2 rounded-md bg-[#1DA1F2] text-white hover:bg-[#1a94df] transition-colors text-xs font-semibold text-center"
                      >
                        Twitter
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("editor.export")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("editor.exportTitle")}</DialogTitle>
                <DialogDescription>
                  {t("editor.exportDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("editor.exportSize")}</Label>
                  <Select
                    value={`${exportSize.width}x${exportSize.height}`}
                    onValueChange={(v) => {
                      const [w, h] = v.split("x").map(Number)
                      const size = EXPORT_SIZES.find((s) => s.width === w && s.height === h)
                      if (size) setExportSize(size)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPORT_SIZES.map((size) => (
                        <SelectItem key={size.label} value={`${size.width}x${size.height}`}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => exportCanvas("png")}>
                    {t("editor.downloadPng")}
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={() => exportCanvas("jpeg")}>
                    {t("editor.downloadJpeg")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar 
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          filteredFrames={filteredFrames}
          addFrameToCanvas={addFrameToCanvas}
          textOptions={textOptions}
          setTextOptions={setTextOptions}
          addText={(options, t) => {
            addText(options, t)
            setActiveMobileTab("editor")
          }}
          session={session}
          aiCredits={aiCredits}
          aiCreditsTotal={aiCreditsTotal}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          aiStyle={aiStyle}
          setAiStyle={setAiStyle}
          aiNegativePrompt={aiNegativePrompt}
          setAiNegativePrompt={setAiNegativePrompt}
          isGenerating={isGenerating}
          handleAIGenerate={handleAIGenerate}
          className={activeMobileTab === "sidebar" ? "flex w-full" : "hidden md:flex"}
        />

        <main className={`flex-1 bg-muted/20 flex flex-col overflow-hidden relative ${activeMobileTab === "editor" ? "flex" : "hidden md:flex"}`}>
          <EditorToolbar 
            canUndo={canUndo}
            canRedo={canRedo}
            undo={undo}
            redo={redo}
            selectedObject={selectedObject}
            bringForward={bringForward}
            sendBackward={sendBackward}
            flipHorizontal={flipHorizontal}
            flipVertical={flipVertical}
            duplicateSelected={duplicateSelected}
            deleteSelected={deleteSelected}
            zoom={zoom}
            handleZoom={handleZoom}
            autoCropToFrame={autoCropToFrame}
            saveState={saveState}
          />

          <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 bg-muted/10 relative">
            <div 
              className="relative shadow-2xl rounded-lg overflow-hidden shrink-0 transition-all duration-200"
              style={{
                width: `${canvasWidth * (zoom / 100)}px`,
                height: `${canvasHeight * (zoom / 100)}px`,
              }}
            >
              <div
                className="bg-white"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                }}
                ref={canvasContainerRef}
              />
            </div>
          </div>
        </main>

        <EditorProperties 
          zoom={zoom}
          handleZoom={handleZoom}
          selectedObject={selectedObject}
          selectedObjectScale={selectedObjectScale}
          selectedObjectAngle={selectedObjectAngle}
          bringForward={bringForward}
          sendBackward={sendBackward}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          duplicateSelected={duplicateSelected}
          deleteSelected={deleteSelected}
          handleObjectScaleChange={handleScaleChange}
          handleObjectAngleChange={handleAngleChange}
          fitPhoto={fitPhoto}
          fillPhoto={fillPhoto}
          fabricRef={fabricRef}
          CANVAS_SIZE={CANVAS_SIZE}
          saveState={saveState}
          autoCropToFrame={autoCropToFrame}
          resetCanvas={resetCanvas}
          className={activeMobileTab === "properties" ? "flex w-full" : "hidden md:flex"}
          onBackToEditor={handleBackToEditor}
        />
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden h-16 border-t bg-card flex items-center justify-around px-4 shrink-0 z-50">
        <button
          onClick={() => setActiveMobileTab("sidebar")}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-full w-20 transition-colors ${
            activeMobileTab === "sidebar" ? "text-rose-500" : "text-muted-foreground"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Modèles</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("editor")}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-full w-20 transition-colors ${
            activeMobileTab === "editor" ? "text-rose-500" : "text-muted-foreground"
          }`}
        >
          <FrameIcon className="w-5 h-5" />
          <span>Éditeur</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("properties")}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-full w-20 transition-colors ${
            activeMobileTab === "properties" ? "text-rose-500" : "text-muted-foreground"
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span>Ajuster</span>
        </button>
      </div>
    </div>
  )
}
