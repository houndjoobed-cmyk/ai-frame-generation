"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import * as fabric from "fabric"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
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
import { dataUrlToBlob } from "@/lib/utils"
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
  Sliders,
  Sparkles,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Wrench
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
  "frameId",
  "baseScale",
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
  const [activeFrameDetails, setActiveFrameDetails] = useState<Frame | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentFrameId, setCurrentFrameId] = useState<string | null>(frameId || null)
  const [activeMobileTab, setActiveMobileTab] = useState<"sidebar" | "editor" | "properties">("editor")
  const [isSharing, setIsSharing] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [copiedFrameLink, setCopiedFrameLink] = useState(false)
  const [exportSize, setExportSize] = useState(EXPORT_SIZES[0])
  const [hasUserPhoto, setHasUserPhoto] = useState(false)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [forceSimplePreview, setForceSimplePreview] = useState(false)
  const [textOptions, setTextOptions] = useState({
    text: "Your Text",
    fontSize: 48,
    fontFamily: "Arial",
    fill: "#000000",
  })

  // Simple Mode is active for unauthenticated visitors (gallery / shared link)
  // or when a logged-in user toggles "Aperçu simple"
  const isLoggedIn = Boolean(session?.user?.id)
  const isSimpleMode = !isLoggedIn || forceSimplePreview

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

  // Fit canvas to screen on mobile and desktop
  useEffect(() => {
    if (!canvasContainerRef.current) return

    const handleResize = () => {
      if (!fabricRef.current || !canvasContainerRef.current) return

      const currentWidth = fabricRef.current.width || CANVAS_SIZE
      const currentHeight = fabricRef.current.height || CANVAS_SIZE

      if (isSimpleMode) {
        const maxCardWidth = Math.min(window.innerWidth - 40, 440)
        const maxCardHeight = Math.max(280, Math.min(window.innerHeight * 0.52, 440))
        const fitZoomX = (maxCardWidth / currentWidth) * 100
        const fitZoomY = (maxCardHeight / currentHeight) * 100
        const fitZoom = Math.min(100, Math.max(25, Math.floor(Math.min(fitZoomX, fitZoomY))))
        handleZoom(fitZoom)
        return
      }

      const parent = canvasContainerRef.current.parentElement?.parentElement
      if (!parent) return

      const parentWidth = parent.clientWidth
      const parentHeight = parent.clientHeight

      const availableWidth = Math.max(200, parentWidth - 48)
      const availableHeight = Math.max(200, parentHeight - 48)

      const fitZoomX = (availableWidth / currentWidth) * 100
      const fitZoomY = (availableHeight / currentHeight) * 100
      const fitZoom = Math.min(100, Math.floor(Math.min(fitZoomX, fitZoomY)))

      if (fitZoom < 100 && fitZoom >= 25) {
        handleZoom(fitZoom)
      } else if (fitZoom >= 100 && window.innerWidth >= 1024) {
        handleZoom(100)
      }
    }

    if (canvasReady) {
      const timer = setTimeout(handleResize, 100)
      window.addEventListener("resize", handleResize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [canvasReady, fabricRef, CANVAS_SIZE, handleZoom, canvasWidth, canvasHeight, isSimpleMode])

  const handleBackToEditor = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.discardActiveObject()
      fabricRef.current.renderAll()
    }
    setActiveMobileTab("editor")
  }, [fabricRef])

  // Load existing project (works for both project owner and guests opening a shared project link)
  useEffect(() => {
    const projectId = searchParams.get("project")
    if (!projectId || !canvasReady) return

    let active = true

    async function loadProject() {
      try {
        const res = await fetch(`/api/projects?id=${projectId}`)
        const data = await res.json()
        
        if (!active) return

        if (res.ok && data.success && data.project) {
          const project = data.project
          setProjectName(project.name)
          if (data.isOwner) {
            setCurrentProjectId(project.id)
          }
          
          if (project.canvas_data && fabricRef.current) {
            const canvas = fabricRef.current
            if (!canvas.getContext()) return

            isTrackingRef.current = false
            
            const width = project.canvas_width || (project.canvas_data as any).width || CANVAS_SIZE
            const height = project.canvas_height || (project.canvas_data as any).height || CANVAS_SIZE
            updateDimensions(width, height)

            await canvas.loadFromJSON(project.canvas_data)
            enforceFrameProperties(canvas)

            // If opened by a guest/non-owner to add their own photo, remove the creator's personal photo
            // if a frame is present, keeping only the frame and text layers
            if (!data.isOwner) {
              const objs = canvas.getObjects()
              const hasFrame = objs.some((o: any) => o.isFrame)
              if (hasFrame) {
                objs
                  .filter((o: any) => (o.type === "image" || o instanceof fabric.FabricImage) && !o.isFrame)
                  .forEach((photo) => canvas.remove(photo))
              }
            }

            const remainingPhoto = canvas
              .getObjects()
              .find((o: any) => (o.type === "image" || o instanceof fabric.FabricImage) && !o.isFrame)
            setHasUserPhoto(Boolean(remainingPhoto))

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
  }, [searchParams, canvasReady, t, initHistory, enforceFrameProperties, fabricRef, isTrackingRef, updateDimensions])

  const getActiveFrameId = useCallback(() => {
    if (currentFrameId) return currentFrameId
    if (frameId) return frameId

    if (fabricRef.current) {
      const frameObj = fabricRef.current.getObjects().find((obj: any) => obj.isFrame)
      if (frameObj) {
        if ((frameObj as any).frameId) return (frameObj as any).frameId
        const src = (frameObj as any).getSrc?.() || (frameObj as any)._element?.src || (frameObj as any).src
        if (src && frames.length > 0) {
          const found = frames.find((f) => f.image_url === src || (f.image_url && src.includes(f.image_url)))
          if (found) return found.id
        }
      }
    }
    return null
  }, [currentFrameId, frameId, fabricRef, frames])

  const isAddingFrameRef = useRef(false)
  const addFrameToCanvas = useCallback(async (imageUrl: string, newFrameId?: string, frameMeta?: Frame) => {
    if (!fabricRef.current || isAddingFrameRef.current) return
    isAddingFrameRef.current = true

    if (newFrameId) {
      setCurrentFrameId(newFrameId)
    }
    if (frameMeta) {
      setActiveFrameDetails(frameMeta)
      setProjectName(frameMeta.name)
    } else if (newFrameId) {
      const matched = frames.find((f) => f.id === newFrameId)
      if (matched) {
        setActiveFrameDetails(matched)
        setProjectName(matched.name)
      }
    }

    try {
      const img = await fabric.FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      })

      if (!img || !fabricRef.current) {
        throw new Error("Impossible de charger l'image du cadre.")
      }

      // Remove existing frames only AFTER new frame image is ready
      const objects = fabricRef.current.getObjects()
      objects.filter((obj) => (obj as any).isFrame).forEach((oldFrame) => {
        fabricRef.current?.remove(oldFrame)
      })

      const frameWidth = img.width || CANVAS_SIZE
      const frameHeight = img.height || CANVAS_SIZE
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

      const scale = newWidth / frameWidth

      img.set({
        left: newWidth / 2,
        top: newHeight / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasControls: false,
        hasBorders: false,
      })
      img.setCoords()
      ;(img as any).isFrame = true
      if (newFrameId) {
        ;(img as any).frameId = newFrameId
      }

      fabricRef.current.add(img)
      fabricRef.current.bringObjectToFront(img)
      fabricRef.current.renderAll()
      saveState()
      toast.success(t("editor.toast.frameAdded"))
      setActiveMobileTab("editor")
    } catch (err) {
      console.error("Frame loading failed:", err)
      toast.error(t("editor.toast.frameAddFailed") || "Erreur lors du chargement du cadre")
    } finally {
      isAddingFrameRef.current = false
    }
  }, [fabricRef, saveState, t, updateDimensions, frames])

  // Fetch frames and categories (skip heavy 50-frame query in Simple Mode when a specific frameId is already requested)
  useEffect(() => {
    if (isSimpleMode && frameId) return

    async function fetchData() {
      const [framesRes, categoriesRes] = await Promise.all([
        supabase
          .from("frames")
          .select("*, category:categories(*)")
          .eq("is_active", true)
          .order("download_count", { ascending: false })
          .limit(24),
        supabase.from("categories").select("*").order("name"),
      ])

      if (framesRes.data) setFrames(framesRes.data as Frame[])
      if (categoriesRes.data) setCategories(categoriesRes.data)
    }

    fetchData()
  }, [supabase, isSimpleMode, frameId])

  // Load initial frame from URL parameter once canvas is ready
  const initialFrameLoadedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!canvasReady || !frameId || initialFrameLoadedRef.current === frameId) return

    async function loadInitialFrame() {
      initialFrameLoadedRef.current = frameId
      setCurrentFrameId(frameId)

      let frame = frames.find((f) => f.id === frameId)
      if (!frame) {
        try {
          const res = await fetch(`/api/frames?id=${encodeURIComponent(frameId!)}`)
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.frame) {
              frame = json.frame
            }
          }
        } catch {
          // Fallback to direct Supabase query below
        }
      }

      if (!frame) {
        const { data: directFrame } = await supabase
          .from("frames")
          .select("*, category:categories(*)")
          .eq("id", frameId)
          .maybeSingle()
        frame = directFrame
      }

      if (frame?.image_url) {
        setActiveFrameDetails(frame)
        setProjectName(frame.name)
        addFrameToCanvas(frame.image_url, frame.id, frame)
      }
    }

    loadInitialFrame()
  }, [canvasReady, frameId, frames, supabase, addFrameToCanvas])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return

    // Use Object URL + offscreen canvas downscaling (max 1600px) so 12MP–48MP iPhone camera photos
    // don't exceed iOS WebKit GPU/RAM limits and crash the tab.
    const objectUrl = URL.createObjectURL(file)
    const rawImg = new Image()
    rawImg.crossOrigin = "anonymous"
    rawImg.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (!fabricRef.current) return

      const MAX_PHOTO_DIM = 1600
      let targetW = rawImg.naturalWidth || rawImg.width
      let targetH = rawImg.naturalHeight || rawImg.height

      if (targetW > MAX_PHOTO_DIM || targetH > MAX_PHOTO_DIM) {
        if (targetW >= targetH) {
          targetH = Math.round((targetH * MAX_PHOTO_DIM) / targetW)
          targetW = MAX_PHOTO_DIM
        } else {
          targetW = Math.round((targetW * MAX_PHOTO_DIM) / targetH)
          targetH = MAX_PHOTO_DIM
        }
      }

      const offscreen = document.createElement("canvas")
      offscreen.width = targetW
      offscreen.height = targetH
      const ctx = offscreen.getContext("2d")
      if (ctx) {
        ctx.drawImage(rawImg, 0, 0, targetW, targetH)
      }
      const compressedDataUrl = offscreen.toDataURL("image/jpeg", 0.9)

      const imgElement = document.createElement("img")
      imgElement.crossOrigin = "anonymous"
      imgElement.src = compressedDataUrl
      imgElement.onload = () => {
        if (!fabricRef.current) return

        const objects = fabricRef.current.getObjects()
        const existingPhotos = objects.filter(
          (obj: any) => (obj.type === "image" || obj instanceof fabric.FabricImage) && !obj.isFrame
        )
        existingPhotos.forEach((photo) => fabricRef.current?.remove(photo))

        const cWidth = fabricRef.current.width || CANVAS_SIZE
        const cHeight = fabricRef.current.height || CANVAS_SIZE

        const img = new fabric.FabricImage(imgElement, {
          left: cWidth / 2,
          top: cHeight / 2,
          originX: "center",
          originY: "center",
          crossOrigin: "anonymous"
        })

        const baseScale = Math.max(
          cWidth / imgElement.width,
          cHeight / imgElement.height
        )
        img.scale(baseScale)
        ;(img as any).baseScale = baseScale

        if (isSimpleMode) {
          img.set({
            hasControls: false,
            hasBorders: false,
            lockRotation: true,
          })
        }

        fabricRef.current.add(img)
        fabricRef.current.sendObjectToBack(img)
        fabricRef.current.setActiveObject(img)
        fabricRef.current.renderAll()
        setHasUserPhoto(true)
        setPhotoZoom(1)
        saveState()
        toast.success(t("editor.toast.photoAdded"))
        setActiveMobileTab("editor")
      }
    }
    rawImg.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      toast.error("Impossible de lire cette photo.")
    }
    rawImg.src = objectUrl

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [fabricRef, saveState, t, isSimpleMode])

  // Direct inline Zoom Slider handler (used in Simple Mode & mobile quick bar)
  const handlePhotoZoomChange = useCallback((newZoom: number) => {
    setPhotoZoom(newZoom)
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    const photoObj = objects.find(
      (obj: any) => (obj.type === "image" || obj instanceof fabric.FabricImage) && !obj.isFrame
    )
    if (!photoObj) return

    const imgEl = (photoObj as any).getElement?.()
    const cW = fabricRef.current.width || CANVAS_SIZE
    const cH = fabricRef.current.height || CANVAS_SIZE
    const baseScale =
      (photoObj as any).baseScale ||
      (imgEl ? Math.max(cW / imgEl.width, cH / imgEl.height) : 1)
    ;(photoObj as any).baseScale = baseScale

    photoObj.scale(baseScale * newZoom)
    photoObj.setCoords()
    fabricRef.current.renderAll()
  }, [fabricRef])

  const handleResetPhotoPosition = useCallback(() => {
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    const photoObj = objects.find(
      (obj: any) => (obj.type === "image" || obj instanceof fabric.FabricImage) && !obj.isFrame
    )
    if (!photoObj) return

    const imgEl = (photoObj as any).getElement?.()
    const cW = fabricRef.current.width || CANVAS_SIZE
    const cH = fabricRef.current.height || CANVAS_SIZE
    const baseScale = imgEl ? Math.max(cW / imgEl.width, cH / imgEl.height) : 1
    ;(photoObj as any).baseScale = baseScale

    photoObj.set({
      left: cW / 2,
      top: cH / 2,
      originX: "center",
      originY: "center",
      scaleX: baseScale,
      scaleY: baseScale,
      angle: 0,
    })
    photoObj.setCoords()
    setPhotoZoom(1)
    fabricRef.current.renderAll()
    saveState()
  }, [fabricRef, saveState])

  const exportCanvas = useCallback(async (format: "png" | "jpeg" | "svg" | "pdf" = "png") => {
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
    fabricRef.current.discardActiveObject()
    fabricRef.current.setZoom(1)
    fabricRef.current.renderAll()

    try {
      if (format === "svg") {
        const svgString = fabricRef.current.toSVG()
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement("a")
        link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.svg`
        link.href = url
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success(t("editor.toast.exportSuccess") || "Téléchargement réussi !")
      } else if (format === "pdf") {
        // High quality PNG rasterized and embedded in a PDF
        const dataUrl = fabricRef.current.toDataURL({
          format: "png",
          quality: 1,
          multiplier,
        })

        const orientation = currentWidth >= currentHeight ? "landscape" : "portrait"
        const { jsPDF } = await import("jspdf")
        
        const exportW = currentWidth * multiplier
        const exportH = currentHeight * multiplier

        const pdf = new jsPDF({
          orientation,
          unit: "px",
          format: [exportW, exportH],
        })

        pdf.addImage(dataUrl, "PNG", 0, 0, exportW, exportH)
        pdf.save(`${projectName.replace(/\s+/g, "-").toLowerCase()}.pdf`)
        toast.success(t("editor.toast.exportSuccess") || "Téléchargement réussi !")
      } else {
        const dataUrl = fabricRef.current.toDataURL({
          format,
          quality: 1,
          multiplier,
        })

        const blob = dataUrlToBlob(dataUrl)
        const blobUrl = URL.createObjectURL(blob)
        const fileName = `${projectName.replace(/\s+/g, "-").toLowerCase()}.${format}`

        const link = document.createElement("a")
        link.download = fileName
        link.href = blobUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
        toast.success(t("editor.toast.exportSuccess") || "Image téléchargée avec succès !")
      }
    } catch (err) {
      console.error("Export error:", err)
      toast.error(t("editor.toast.exportError") || "Erreur lors du téléchargement.")
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

      const blob = dataUrlToBlob(dataUrl)
      
      const fileName = `${session.user.id}/${Date.now()}-thumbnail.jpg`
      const { error: uploadError } = await supabase.storage
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
          const activeId = getActiveFrameId()
          const nextUrl = activeId
            ? `/editor?frame=${activeId}&project=${data.project.id}`
            : `/editor?project=${data.project.id}`
          router.replace(nextUrl, { scroll: false })
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
  }, [session, projectName, currentProjectId, router, t, fabricRef, supabase.storage, getActiveFrameId])

  const shareProject = useCallback(async () => {
    if (!fabricRef.current) return

    setIsSharing(true)
    setShareId(null)
    try {
      const cWidth = fabricRef.current.width || CANVAS_SIZE
      const cHeight = fabricRef.current.height || CANVAS_SIZE

      fabricRef.current.discardActiveObject()
      fabricRef.current.renderAll()

      const dataUrl = fabricRef.current.toDataURL({
        format: "png",
        multiplier: 1.5,
      })

      const isValidUuid =
        currentProjectId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentProjectId)

      const payload = {
        base64Image: dataUrl,
        projectId: isValidUuid ? currentProjectId : null,
        exportPreset:
          cWidth === cHeight
            ? "square"
            : cHeight > cWidth
            ? "story"
            : "custom",
        width: Math.round(cWidth),
        height: Math.round(cHeight),
      }

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success && data.shareId) {
        setShareId(data.shareId)
        setCopiedShareLink(false)
        toast.success(t("editor.toast.shareCreated") || "Lien de partage prêt !")
      } else {
        throw new Error(data.error || "Failed to create share")
      }
    } catch (err: any) {
      console.error("Share error:", err)
    } finally {
      setIsSharing(false)
    }
  }, [currentProjectId, t, fabricRef])

  const fitPhoto = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    if (!(selectedObject.type === "image" || selectedObject instanceof fabric.FabricImage)) return
    
    const cWidth = fabricRef.current.width || CANVAS_SIZE
    const cHeight = fabricRef.current.height || CANVAS_SIZE
    
    const imgEl = (selectedObject as any).getElement()
    if (!imgEl) return
    
    const scale = Math.min(
      cWidth / imgEl.width,
      cHeight / imgEl.height
    )
    
    selectedObject.set({
      scaleX: scale,
      scaleY: scale,
      left: cWidth / 2,
      top: cHeight / 2,
      originX: "center",
      originY: "center"
    })
    
    selectedObject.setCoords()
    fabricRef.current.renderAll()
    saveState()
  }, [fabricRef, selectedObject, saveState])
  
  const fillPhoto = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    if (!(selectedObject.type === "image" || selectedObject instanceof fabric.FabricImage)) return
    
    const cWidth = fabricRef.current.width || CANVAS_SIZE
    const cHeight = fabricRef.current.height || CANVAS_SIZE
    
    const imgEl = (selectedObject as any).getElement()
    if (!imgEl) return
    
    const scale = Math.max(
      cWidth / imgEl.width,
      cHeight / imgEl.height
    )
    
    selectedObject.set({
      scaleX: scale,
      scaleY: scale,
      left: cWidth / 2,
      top: cHeight / 2,
      originX: "center",
      originY: "center"
    })
    
    selectedObject.setCoords()
    fabricRef.current.renderAll()
    saveState()
  }, [fabricRef, selectedObject, saveState])

  const filteredFrames = selectedCategory === "all"
    ? frames
    : frames.filter((f) => f.category?.slug === selectedCategory)

  const activeFrameId = getActiveFrameId()
  const resolvedFrame = activeFrameDetails || frames.find((f) => f.id === activeFrameId) || null

  const frameShareUrl = activeFrameId && typeof window !== "undefined"
    ? `${window.location.origin}/editor?frame=${activeFrameId}`
    : null
  const creationShareUrl = shareId && typeof window !== "undefined"
    ? `${window.location.origin}/share/${shareId}${activeFrameId ? `?frame=${activeFrameId}` : ""}`
    : null

  const primaryInviteUrl = frameShareUrl || creationShareUrl || (typeof window !== "undefined" ? window.location.href : "")

  return (
    <div className={`flex flex-col w-full bg-background ${isSimpleMode ? "min-h-dvh overflow-y-auto" : "h-dvh overflow-hidden"}`}>
      <header className="h-16 border-b flex items-center justify-between px-3 sm:px-6 bg-card shrink-0 w-full sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
          <Link
            href={isLoggedIn ? "/dashboard" : "/gallery"}
            className="text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1 text-sm font-medium"
            title={isLoggedIn ? "Tableau de bord" : "Galerie"}
          >
            <ChevronLeft className="w-5 h-5" />
            {isSimpleMode && <span className="hidden xs:inline">Galerie</span>}
          </Link>
          {isSimpleMode ? (
            <h1 className="font-bold text-sm sm:text-lg truncate text-foreground">
              {resolvedFrame?.name || projectName}
            </h1>
          ) : (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-28 sm:w-64 font-semibold bg-transparent border-transparent hover:border-input focus:border-input text-sm sm:text-base truncate"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForceSimplePreview((prev) => !prev)}
              className="gap-1.5 text-xs font-medium"
              title={forceSimplePreview ? "Revenir au Studio complet" : "Voir l'interface simple invité"}
            >
              {forceSimplePreview ? (
                <>
                  <Wrench className="w-4 h-4 text-primary" />
                  <span>Mode Studio</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="hidden md:inline">Vue simple</span>
                </>
              )}
            </Button>
          )}

          {!isSimpleMode && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 font-medium"
              >
                <Camera className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Ajouter ma photo</span>
              </Button>
              <Button variant="outline" size="sm" onClick={saveProject} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{t("editor.save")}</span>
              </Button>
            </>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={shareProject} disabled={isSharing}>
                {isSharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">Partager</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Share2 className="w-5 h-5 text-primary" />
                  Partager ce cadre
                </DialogTitle>
                <DialogDescription>
                  Permettez à vos amis, participants ou abonnés d&apos;ajouter leur propre photo dans ce cadre sans aucune connexion requise !
                </DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-4">
                <div className="space-y-4">
                  {/* Primary Card: Frame link for friends to add their photo */}
                  <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Lien pour que vos amis ajoutent leur photo
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                        Accès libre
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      En cliquant sur ce lien, ils arrivent directement sur l&apos;interface rapide de ce cadre et peuvent y insérer leur photo en 1 clic (sans créer de compte).
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        value={primaryInviteUrl} 
                        readOnly
                        className="text-xs font-mono bg-background/90"
                      />
                      <Button
                        size="sm"
                        className="shrink-0"
                        onClick={async () => {
                          await navigator.clipboard.writeText(primaryInviteUrl)
                          setCopiedFrameLink(true)
                          toast.success("Lien copié ! Vos amis peuvent maintenant y ajouter leur photo.")
                          setTimeout(() => setCopiedFrameLink(false), 2500)
                        }}
                      >
                        {copiedFrameLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span className="ml-1.5 hidden sm:inline">{copiedFrameLink ? "Copié !" : "Copier"}</span>
                      </Button>
                    </div>

                    {/* Social sharing for inviting friends to frame */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Regarde mon cadre ! Clique ici pour ajouter ta photo dans ce cadre : ${primaryInviteUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25D366] text-white hover:bg-[#20ba59] transition-colors text-xs font-semibold text-center shadow-xs"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(primaryInviteUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1877F2] text-white hover:bg-[#156bec] transition-colors text-xs font-semibold text-center shadow-xs"
                      >
                        Facebook
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Ajoutez votre photo dans ce cadre !`)}&url=${encodeURIComponent(primaryInviteUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1DA1F2] text-white hover:bg-[#1a94df] transition-colors text-xs font-semibold text-center shadow-xs"
                      >
                        Twitter
                      </a>
                    </div>
                  </div>

                  {/* Secondary: Preview page of completed photo */}
                  {isSharing ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Génération de l&apos;aperçu de votre photo encadrée...</span>
                    </div>
                  ) : shareId ? (
                    <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Page d&apos;aperçu de votre création terminée
                        </span>
                        <a
                          href={`/share/${shareId}${activeFrameId ? `?frame=${activeFrameId}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Ouvrir la page &rarr;
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={creationShareUrl || ""} 
                          readOnly
                          className="text-xs h-8 bg-background/60"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 shrink-0"
                          onClick={async () => {
                            if (creationShareUrl) {
                              await navigator.clipboard.writeText(creationShareUrl)
                              setCopiedShareLink(true)
                              toast.success(t("editor.toast.shareSuccess") || "Lien de la photo copié !")
                              setTimeout(() => setCopiedShareLink(false), 2000)
                            }
                          }}
                        >
                          {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {!isSimpleMode && (
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => exportCanvas("png")}>
                      {t("editor.downloadPng")}
                    </Button>
                    <Button variant="outline" onClick={() => exportCanvas("jpeg")}>
                      {t("editor.downloadJpeg")}
                    </Button>
                    <Button variant="outline" onClick={() => exportCanvas("svg")}>
                      {t("editor.downloadSvg")}
                    </Button>
                    <Button variant="outline" onClick={() => exportCanvas("pdf")}>
                      {t("editor.downloadPdf")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className={`flex-1 flex ${isSimpleMode ? "flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-6 bg-muted/20" : "overflow-hidden"}`}>
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
          className={isSimpleMode ? "hidden" : (activeMobileTab === "sidebar" ? "flex w-full" : "hidden lg:flex")}
        />

        <main
          className={
            isSimpleMode
              ? "w-full max-w-lg mx-auto flex flex-col items-center gap-4 pb-10"
              : `flex-1 bg-muted/20 flex flex-col overflow-hidden relative ${activeMobileTab === "editor" ? "flex" : "hidden lg:flex"}`
          }
        >
          {!isSimpleMode && (
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
          )}

          {isSimpleMode && resolvedFrame && (
            <div className="w-full text-center space-y-1.5 pt-1">
              {resolvedFrame.category?.name && (
                <Badge variant="secondary" className="text-xs">
                  {resolvedFrame.category.name}
                </Badge>
              )}
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {resolvedFrame.name}
              </h2>
            </div>
          )}

          {/* Shared Canvas Stage — key="canvas-stage" guarantees the Fabric canvas DOM node is never remounted */}
          <div
            key="canvas-stage"
            className={
              isSimpleMode
                ? "w-full bg-card border rounded-2xl p-3 sm:p-5 shadow-lg flex flex-col items-center gap-4"
                : "flex-1 overflow-auto flex items-center justify-center p-4 lg:p-8 bg-muted/10 relative"
            }
          >
            <div 
              className="relative shadow-xl rounded-lg overflow-hidden shrink-0 transition-all duration-200 border border-border/50"
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

            {isSimpleMode && (
              <div className="w-full space-y-4 pt-1">
                {/* Helper prompt */}
                <p className="text-xs text-center text-muted-foreground">
                  {hasUserPhoto
                    ? "Glissez la photo avec votre doigt pour la positionner, puis ajustez le zoom ci-dessous."
                    : "Appuyez sur « Choisir » pour insérer votre photo dans ce cadre."}
                </p>

                {/* Inline Zoom Slider (Paxframe-style) */}
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/50 border">
                  <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Slider
                    value={[photoZoom]}
                    min={0.2}
                    max={3}
                    step={0.02}
                    disabled={!hasUserPhoto}
                    onValueChange={([val]) => handlePhotoZoomChange(val)}
                    className="flex-1"
                  />
                  <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
                  {hasUserPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetPhotoPosition}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      title="Centrer et réinitialiser la photo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Two Main Action Buttons Side by Side: Choisir + Télécharger */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    size="lg"
                    variant={hasUserPhoto ? "outline" : "default"}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 rounded-xl font-bold text-sm sm:text-base gap-2 shadow-sm"
                  >
                    <Camera className="w-5 h-5" />
                    {hasUserPhoto ? "Changer" : "Choisir"}
                  </Button>

                  <Button
                    type="button"
                    size="lg"
                    disabled={!hasUserPhoto}
                    onClick={() => exportCanvas("png")}
                    className="h-12 rounded-xl font-bold text-sm sm:text-base gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger
                  </Button>
                </div>

                {/* Social Share Bar */}
                <div className="pt-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">Partager ce cadre sur :</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Ajoute ta photo sur le cadre "${resolvedFrame?.name || projectName}" : ${primaryInviteUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-semibold hover:bg-[#20ba59] transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(primaryInviteUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#1877F2] text-white font-semibold hover:bg-[#156bec] transition-colors"
                    >
                      Facebook
                    </a>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={async () => {
                        await navigator.clipboard.writeText(primaryInviteUrl)
                        setCopiedFrameLink(true)
                        toast.success("Lien copié !")
                        setTimeout(() => setCopiedFrameLink(false), 2000)
                      }}
                    >
                      {copiedFrameLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFrameLink ? "Copié" : "Copier"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simple Mode: Quick frame selector if no frame was specified in URL */}
          {isSimpleMode && !activeFrameId && frames.length > 0 && (
            <div className="w-full bg-card border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold">Choisir un modèle de cadre</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {frames.slice(0, 12).map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => frame.image_url && addFrameToCanvas(frame.image_url, frame.id, frame)}
                    className="aspect-square rounded-lg bg-muted border hover:border-primary overflow-hidden relative"
                  >
                    {(frame.thumbnail_url || frame.image_url) && (
                      <img
                        src={frame.thumbnail_url || frame.image_url}
                        alt={frame.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simple Mode: Event Description & 3 Simple Steps (like Paxframe) */}
          {isSimpleMode && (
            <div className="w-full space-y-4">
              {resolvedFrame?.description && (
                <div className="w-full bg-card border rounded-2xl p-4 sm:p-5 space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {resolvedFrame.description}
                  </p>
                </div>
              )}

              <div className="w-full bg-card border rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Comment réaliser votre frame
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                      1
                    </div>
                    <p className="text-xs font-semibold">Charger une photo</p>
                    <p className="text-[11px] text-muted-foreground">
                      Cliquez sur « Choisir » pour sélectionner votre photo.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                      2
                    </div>
                    <p className="text-xs font-semibold">Télécharger votre frame</p>
                    <p className="text-[11px] text-muted-foreground">
                      Ajustez le zoom puis cliquez sur « Télécharger ».
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                      3
                    </div>
                    <p className="text-xs font-semibold">Partager votre image</p>
                    <p className="text-[11px] text-muted-foreground">
                      Affichez fièrement votre visuel sur vos réseaux sociaux.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {!isSimpleMode && (
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
            className={activeMobileTab === "properties" ? "flex w-full" : "hidden lg:flex"}
            onBackToEditor={handleBackToEditor}
          />
        )}
      </div>

      {/* Mobile Tab Bar — only shown in full Studio Mode for logged-in users */}
      {!isSimpleMode && (
        <div className="lg:hidden h-16 border-t bg-card flex items-center justify-around px-4 shrink-0 z-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 text-xs font-semibold h-full w-20 transition-colors text-primary"
          >
            <Camera className="w-5 h-5" />
            <span>Ma photo</span>
          </button>
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
      )}
    </div>
  )
}
