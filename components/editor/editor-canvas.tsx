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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Frame as FrameIcon,
  Upload,
  Type,
  Download,
  Save,
  Undo,
  Redo,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Move,
  ChevronLeft,
  Image as ImageIcon,
  Palette,
  ArrowUp,
  ArrowDown,
  Copy,
  FlipHorizontal,
  FlipVertical,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Sparkles,
  Loader2,
  Share2,
  Check,
  Crop,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

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

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isTrackingRef = useRef(true)

  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [zoom, setZoom] = useState(100)
  const [projectName, setProjectName] = useState(t("editor.untitled"))
  const [isSaving, setIsSaving] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [exportSize, setExportSize] = useState(EXPORT_SIZES[0])
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [selectedObjectScale, setSelectedObjectScale] = useState(100)
  const [selectedObjectAngle, setSelectedObjectAngle] = useState(0)
  const [textOptions, setTextOptions] = useState({
    text: "Your Text",
    fontSize: 48,
    fontFamily: "Arial",
    fill: "#000000",
  })

  // AI Generation States
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiNegativePrompt, setAiNegativePrompt] = useState("")
  const [aiStyle, setAiStyle] = useState("standard")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiCredits, setAiCredits] = useState<number | null>(null)
  const [aiCreditsTotal, setAiCreditsTotal] = useState<number | null>(null)

  const supabase = createClient()

  const enforceFrameProperties = useCallback((canvas: fabric.Canvas) => {
    const objects = canvas.getObjects()
    const frameObj = objects.find((obj) => (obj as any).isFrame)
    if (frameObj) {
      frameObj.set({
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
      const index = objects.indexOf(frameObj)
      if (index !== objects.length - 1) {
        canvas.bringObjectToFront(frameObj)
      }
    }
  }, [])

  const saveState = useCallback(() => {
    if (!fabricRef.current || !isTrackingRef.current) return
    const json = JSON.stringify((fabricRef.current as any).toJSON(CUSTOM_PROPS))
    setUndoStack((prev) => [...prev.slice(-19), json])
    setRedoStack([])
    setShareId(null)
  }, [])

  // Fetch AI credits
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
    if (session?.user?.id) {
      fetchCredits()
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

      // Poll status endpoint every 1.5s
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

                // Remove existing user photos so they don't stack
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

                // Scale to fill/cover the canvas (crop mode)
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
  }, [session, aiPrompt, aiNegativePrompt, aiStyle, fetchCredits, saveState, t])

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasContainerRef.current) return

    // Create canvas dynamically to avoid React hydration/reconciliation errors
    const canvasEl = document.createElement("canvas")
    canvasContainerRef.current.appendChild(canvasEl)

    const canvas = new fabric.Canvas(canvasEl, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas

    // Selection events
    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0] || null
      setSelectedObject(obj)
      if (obj) {
        setSelectedObjectScale(Math.round((obj.scaleX || 1) * 100))
        setSelectedObjectAngle(Math.round(obj.angle || 0))
      }
    })

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0] || null
      setSelectedObject(obj)
      if (obj) {
        setSelectedObjectScale(Math.round((obj.scaleX || 1) * 100))
        setSelectedObjectAngle(Math.round(obj.angle || 0))
      }
    })

    canvas.on("selection:cleared", () => {
      setSelectedObject(null)
    })

    // Track changes for undo/redo
    canvas.on("object:modified", (e) => {
      const obj = e.target
      if (obj && obj === canvas.getActiveObject()) {
        setSelectedObjectScale(Math.round((obj.scaleX || 1) * 100))
        setSelectedObjectAngle(Math.round(obj.angle || 0))
      }
      saveState()
    })

    canvas.on("object:added", (e) => {
      const addedObj = e.target
      if (addedObj && !(addedObj as any).isFrame) {
        const objects = canvas.getObjects()
        const frameObj = objects.find((obj) => (obj as any).isFrame)
        if (frameObj) {
          const index = objects.indexOf(frameObj)
          if (index !== objects.length - 1) {
            canvas.bringObjectToFront(frameObj)
          }
        }
      }
      saveState()
    })

    // Initial state
    saveState()
    setCanvasReady(true)

    return () => {
      setCanvasReady(false)
      canvas.dispose()
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = ""
      }
    }
  }, [])

  // Load existing project if project query param exists
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
            
            // Check if canvas is disposed
            if (!canvas.getContext()) {
              console.warn("Attempted to load project on a disposed canvas")
              return
            }

            isTrackingRef.current = false
            
            // Set canvas dimensions from project attributes
            const width = project.canvas_width || (project.canvas_data as any).width || CANVAS_SIZE
            const height = project.canvas_height || (project.canvas_data as any).height || CANVAS_SIZE
            canvas.setDimensions({ width, height })

            await canvas.loadFromJSON(project.canvas_data)
            enforceFrameProperties(canvas)
            canvas.renderAll()
            isTrackingRef.current = true
            
            // Re-initialize undo stack with the loaded state
            const loadedJson = JSON.stringify((canvas as any).toJSON(CUSTOM_PROPS))
            setUndoStack([loadedJson])
            setRedoStack([])
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

    return () => {
      active = false
    }
  }, [searchParams, session, canvasReady, t])


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

      // Load specific frame if provided
      if (frameId && framesRes.data) {
        const frame = framesRes.data.find((f: any) => f.id === frameId)
        if (frame?.image_url) {
          addFrameToCanvas(frame.image_url)
        }
      }
    }

    fetchData()
  }, [frameId])

  const undo = useCallback(() => {
    if (undoStack.length <= 1 || !fabricRef.current) return
    const newStack = [...undoStack]
    const current = newStack.pop()!
    setRedoStack((prev) => [...prev, current])
    const previous = newStack[newStack.length - 1]
    
    isTrackingRef.current = false
    fabricRef.current.loadFromJSON(JSON.parse(previous)).then(() => {
      if (fabricRef.current) enforceFrameProperties(fabricRef.current)
      fabricRef.current?.renderAll()
      isTrackingRef.current = true
    })
    
    setUndoStack(newStack)
    setShareId(null)
  }, [undoStack, enforceFrameProperties])

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !fabricRef.current) return
    const newStack = [...redoStack]
    const next = newStack.pop()!
    setUndoStack((prev) => [...prev, next])
    
    isTrackingRef.current = false
    fabricRef.current.loadFromJSON(JSON.parse(next)).then(() => {
      if (fabricRef.current) enforceFrameProperties(fabricRef.current)
      fabricRef.current?.renderAll()
      isTrackingRef.current = true
    })
    
    setRedoStack(newStack)
    setShareId(null)
  }, [redoStack, enforceFrameProperties])

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

        // Remove existing user photos so they don't stack
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

        // Scale to fill/cover the canvas (crop mode)
        const scale = Math.max(
          canvasWidth / imgElement.width,
          canvasHeight / imgElement.height
        )
        img.scale(scale)

        fabricRef.current.add(img)
        fabricRef.current.sendObjectToBack(img)
        fabricRef.current.setActiveObject(img)
        fabricRef.current.renderAll()
        toast.success(t("editor.toast.photoAdded"))
      }
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [t])

  const addFrameToCanvas = useCallback(async (imageUrl: string) => {
    if (!fabricRef.current) return

    try {
      // Remove existing frame if any
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

      // Get dimensions of frame and canvas
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

      // Update canvas dimensions
      fabricRef.current.setDimensions({ width: newWidth, height: newHeight })

      // Calculate shift offsets for other objects
      const offsetX = (newWidth - oldWidth) / 2
      const offsetY = (newHeight - oldHeight) / 2

      // Adjust other objects positions by offset
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

      // Scale to match canvas exactly (no white margins)
      const scale = newWidth / frameWidth
      img.scale(scale)

      fabricRef.current.add(img)
      fabricRef.current.bringObjectToFront(img)
      fabricRef.current.renderAll()
      saveState()
      toast.success(t("editor.toast.frameAdded"))
    } catch (err) {
      console.error("Frame loading failed:", err)
      toast.error(t("editor.toast.frameFailed"))
    }
  }, [saveState, t])

  const addText = useCallback(() => {
    if (!fabricRef.current) return

    const canvasWidth = fabricRef.current.width || CANVAS_SIZE
    const canvasHeight = fabricRef.current.height || CANVAS_SIZE

    const text = new fabric.IText(textOptions.text, {
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: "center",
      originY: "center",
      fontSize: textOptions.fontSize,
      fontFamily: textOptions.fontFamily,
      fill: textOptions.fill,
    })

    fabricRef.current.add(text)
    fabricRef.current.setActiveObject(text)
    fabricRef.current.renderAll()
    toast.success(t("editor.toast.textAdded"))
  }, [textOptions, t])

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    fabricRef.current.remove(selectedObject)
    fabricRef.current.renderAll()
    setSelectedObject(null)
    toast.success(t("editor.toast.objDeleted"))
  }, [selectedObject, t])

  const duplicateSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    
    selectedObject.clone().then((cloned) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20,
      })
      fabricRef.current?.add(cloned)
      fabricRef.current?.setActiveObject(cloned)
      fabricRef.current?.renderAll()
      toast.success(t("editor.toast.objDuplicated"))
    })
  }, [selectedObject, t])

  const bringForward = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    fabricRef.current.bringObjectForward(selectedObject)
    enforceFrameProperties(fabricRef.current)
    fabricRef.current.renderAll()
  }, [selectedObject, enforceFrameProperties])

  const sendBackward = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    fabricRef.current.sendObjectBackwards(selectedObject)
    enforceFrameProperties(fabricRef.current)
    fabricRef.current.renderAll()
  }, [selectedObject, enforceFrameProperties])

  const flipHorizontal = useCallback(() => {
    if (!selectedObject) return
    selectedObject.set("flipX", !selectedObject.flipX)
    fabricRef.current?.renderAll()
  }, [selectedObject])

  const flipVertical = useCallback(() => {
    if (!selectedObject) return
    selectedObject.set("flipY", !selectedObject.flipY)
    fabricRef.current?.renderAll()
  }, [selectedObject])

  const handleZoom = useCallback((value: number) => {
    if (!fabricRef.current) return
    setZoom(value)
    fabricRef.current.setZoom(value / 100)
    fabricRef.current.renderAll()
  }, [])

  const resetCanvas = useCallback(() => {
    if (!fabricRef.current) return
    fabricRef.current.clear()
    fabricRef.current.backgroundColor = "#ffffff"
    fabricRef.current.renderAll()
    saveState()
    toast.success(t("editor.toast.canvasCleared"))
  }, [saveState, t])

  const autoCropToFrame = useCallback(() => {
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    const frameObj = objects.find((obj) => (obj as any).isFrame) as fabric.FabricImage
    if (!frameObj) {
      toast.error(t("editor.toast.noFrameToCrop") || "Aucun cadre trouvé sur le canevas.")
      return
    }

    const imgEl = frameObj.getElement()
    if (!imgEl) return

    const oldWidth = fabricRef.current.width || CANVAS_SIZE
    const oldHeight = fabricRef.current.height || CANVAS_SIZE

    const frameWidth = imgEl.width
    const frameHeight = imgEl.height

    let newWidth = CANVAS_SIZE
    let newHeight = CANVAS_SIZE

    if (frameWidth >= frameHeight) {
      newWidth = CANVAS_SIZE
      newHeight = Math.round(CANVAS_SIZE * (frameHeight / frameWidth))
    } else {
      newHeight = CANVAS_SIZE
      newWidth = Math.round(CANVAS_SIZE * (frameWidth / frameHeight))
    }

    fabricRef.current.setDimensions({ width: newWidth, height: newHeight })

    // Center the frame exactly
    frameObj.set({
      left: newWidth / 2,
      top: newHeight / 2,
      scaleX: newWidth / frameWidth,
      scaleY: newWidth / frameWidth,
    })
    frameObj.setCoords()

    // Adjust other objects positions by offset
    const offsetX = (newWidth - oldWidth) / 2
    const offsetY = (newHeight - oldHeight) / 2

    const otherObjects = objects.filter((obj) => obj !== frameObj)
    otherObjects.forEach((obj) => {
      obj.set({
        left: (obj.left || 0) + offsetX,
        top: (obj.top || 0) + offsetY,
      })
      obj.setCoords()
    })

    fabricRef.current.renderAll()
    saveState()
    toast.success(t("editor.toast.croppedToFrame") || "Canevas recadré automatiquement sur le cadre !")
  }, [saveState, t])

  const handleObjectScaleChange = useCallback((value: number) => {
    if (!selectedObject) return
    const scale = value / 100
    selectedObject.set({
      scaleX: scale,
      scaleY: scale
    })
    setSelectedObjectScale(value)
    fabricRef.current?.renderAll()
    saveState()
  }, [selectedObject, saveState])

  const handleObjectAngleChange = useCallback((value: number) => {
    if (!selectedObject) return
    selectedObject.set({ angle: value })
    setSelectedObjectAngle(value)
    fabricRef.current?.renderAll()
    saveState()
  }, [selectedObject, saveState])

  const fitPhoto = useCallback(() => {
    if (!selectedObject || !fabricRef.current) return
    const obj = selectedObject as fabric.FabricImage
    const imgEl = obj.getElement()
    if (!imgEl) return

    const canvasWidth = fabricRef.current.width || CANVAS_SIZE
    const canvasHeight = fabricRef.current.height || CANVAS_SIZE

    const scale = Math.min(
      canvasWidth / imgEl.width,
      canvasHeight / imgEl.height
    )
    obj.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
    })
    setSelectedObjectScale(Math.round(scale * 100))
    fabricRef.current.renderAll()
    saveState()
  }, [selectedObject, saveState])

  const fillPhoto = useCallback(() => {
    if (!selectedObject || !fabricRef.current) return
    const obj = selectedObject as fabric.FabricImage
    const imgEl = obj.getElement()
    if (!imgEl) return

    const canvasWidth = fabricRef.current.width || CANVAS_SIZE
    const canvasHeight = fabricRef.current.height || CANVAS_SIZE

    const scale = Math.max(
      canvasWidth / imgEl.width,
      canvasHeight / imgEl.height
    )
    obj.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
    })
    setSelectedObjectScale(Math.round(scale * 100))
    fabricRef.current.renderAll()
    saveState()
  }, [selectedObject, saveState])

  const exportCanvas = useCallback(async (format: "png" | "jpeg") => {
    if (!fabricRef.current) return

    try {
      // 1. Verify and record export permission on the backend
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width: exportSize.width,
          height: exportSize.height,
          fileFormat: format,
          exportPreset: exportSize.label.includes("Story") ? "story" : "square",
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || "Échec de l'exportation.", {
          action: {
            label: t("nav.pricing"),
            onClick: () => router.push("/pricing")
          }
        })
        return
      }

      // 2. Perform client-side download
      const canvasWidth = fabricRef.current.width || CANVAS_SIZE
      const dataURL = fabricRef.current.toDataURL({
        format,
        quality: 1,
        multiplier: exportSize.width / canvasWidth,
      })

      const link = document.createElement("a")
      link.download = `${projectName}.${format}`
      link.href = dataURL
      link.click()

      toast.success(`${t("editor.toast.exported")} ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Export canvas error:", error)
      toast.error("Une erreur est survenue lors de l'exportation.")
    }
  }, [exportSize, projectName, t, router])

  const saveProject = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error(t("editor.toast.signInSave"))
      return
    }

    if (!fabricRef.current) return

    setIsSaving(true)
    try {
      const canvasData = (fabricRef.current as any).toJSON(CUSTOM_PROPS)
      
      let thumbnail = ""
      try {
        thumbnail = fabricRef.current.toDataURL({
          format: "jpeg",
          quality: 0.5,
          multiplier: 0.25,
        })
      } catch (thumbErr) {
        console.warn("Failed to generate project thumbnail (CORS/tainted canvas):", thumbErr)
      }

      const isUpdate = !!currentProjectId
      const url = "/api/projects"
      const method = isUpdate ? "PUT" : "POST"
      const body = {
        id: currentProjectId,
        name: projectName,
        canvasData,
        thumbnailUrl: thumbnail || null,
        canvasWidth: fabricRef.current.width,
        canvasHeight: fabricRef.current.height,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Save failed")
      }

      // If it's a new project, save the ID and update URL query param
      if (!isUpdate && data.project?.id) {
        setCurrentProjectId(data.project.id)
        const newUrl = `${window.location.pathname}?project=${data.project.id}`
        window.history.pushState(null, "", newUrl)
      }

      toast.success(t("editor.toast.projectSaved"))
    } catch (err) {
      console.error("Save project error:", err)
      toast.error(t("editor.toast.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }, [session, projectName, currentProjectId, t])

  const handleShare = async () => {
    if (!session?.user?.id) {
      toast.error(t("editor.toast.signInSave"))
      return
    }

    if (!fabricRef.current) return

    setIsSharing(true)
    try {
      const base64Image = fabricRef.current.toDataURL({
        format: "png",
        quality: 0.9,
        multiplier: 1.0,
      })

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image,
          projectId: currentProjectId,
          exportPreset: exportSize.label.includes("Story") ? "story" : "square",
          width: fabricRef.current.width,
          height: fabricRef.current.height,
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate share link")
      }

      setShareId(data.shareId)
      toast.success(t("editor.toast.shareSuccess") || "Lien de partage généré !")
    } catch (err) {
      console.error("Share error:", err)
      toast.error(t("editor.toast.shareFailed") || "Une erreur est survenue lors du partage.")
    } finally {
      setIsSharing(false)
    }
  }


  const filteredFrames = selectedCategory === "all"
    ? frames
    : frames.filter((f) => f.category?.slug === selectedCategory)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FrameIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold hidden sm:block">Event Frames</span>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-48 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={undoStack.length <= 1}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={redoStack.length === 0}>
            <Redo className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={saveProject} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {t("editor.save")}
          </Button>
          <Dialog onOpenChange={(open) => { if (!open) setCopiedShareLink(false) }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                {t("editor.share")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("editor.shareTitle")}</DialogTitle>
                <DialogDescription>
                  {t("editor.shareDesc")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {!session?.user?.id ? (
                  <p className="text-sm text-muted-foreground text-center">
                    {t("editor.toast.signInSave")}
                  </p>
                ) : !shareId ? (
                  <Button 
                    className="w-full flex items-center justify-center gap-2" 
                    onClick={handleShare} 
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("editor.sharing")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t("editor.shareBtn")}
                      </>
                    )}
                  </Button>
                ) : (
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
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                {t("editor.export")}
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
        {/* Left Sidebar - Tools */}
        <aside className="w-72 border-r bg-muted/30 flex flex-col">
          <Tabs defaultValue="upload" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 m-2">
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="frames" className="text-xs">
                <Layers className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">
                <Sparkles className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="upload" className="p-4 mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("editor.uploadPhoto")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {t("editor.clickUpload")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("editor.fileTypes")}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="frames" className="p-4 mt-0 space-y-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("editor.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("editor.allCategories")}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  {filteredFrames.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => frame.image_url && addFrameToCanvas(frame.image_url)}
                      className="aspect-square rounded-lg bg-muted border hover:border-primary transition-colors overflow-hidden relative group"
                    >
                      {frame.thumbnail_url || frame.image_url ? (
                        <img
                          src={frame.thumbnail_url || frame.image_url}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Layers className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium px-2 text-center">
                          {frame.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredFrames.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("editor.noFrames")}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="text" className="p-4 mt-0 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.text")}</Label>
                    <Input
                      value={textOptions.text}
                      onChange={(e) => setTextOptions((o) => ({ ...o, text: e.target.value }))}
                      placeholder={t("editor.enterText")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.fontSize")}: {textOptions.fontSize}px</Label>
                    <Slider
                      value={[textOptions.fontSize]}
                      onValueChange={([v]) => setTextOptions((o) => ({ ...o, fontSize: v }))}
                      min={12}
                      max={120}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.font")}</Label>
                    <Select
                      value={textOptions.fontFamily}
                      onValueChange={(v) => setTextOptions((o) => ({ ...o, fontFamily: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Impact">Impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.color")}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={textOptions.fill}
                        onChange={(e) => setTextOptions((o) => ({ ...o, fill: e.target.value }))}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={textOptions.fill}
                        onChange={(e) => setTextOptions((o) => ({ ...o, fill: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <Button onClick={addText} className="w-full">
                    <Type className="w-4 h-4 mr-2" />
                    {t("editor.addText")}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="p-4 mt-0 space-y-4">
                <div className="space-y-4">
                  {/* Credits tracker */}
                  {session?.user && aiCredits !== null && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex justify-between items-center text-xs">
                      <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        {t("editor.aiCredits")}
                      </span>
                      <span className="font-semibold text-primary">
                        {aiCredits} / {aiCreditsTotal} {t("editor.aiCreditsDesc")}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.aiPrompt")}</Label>
                    <Input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={t("editor.aiPromptPlaceholder")}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.aiStyle")}</Label>
                    <Select value={aiStyle} onValueChange={setAiStyle} disabled={isGenerating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">{t("editor.aiStyleStandard")}</SelectItem>
                        <SelectItem value="festive">{t("editor.aiStyleFestive")}</SelectItem>
                        <SelectItem value="elegant">{t("editor.aiStyleElegant")}</SelectItem>
                        <SelectItem value="cartoon">{t("editor.aiStyleCartoon")}</SelectItem>
                        <SelectItem value="neon">{t("editor.aiStyleNeon")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">{t("editor.aiNegativePrompt")}</Label>
                    <Input
                      value={aiNegativePrompt}
                      onChange={(e) => setAiNegativePrompt(e.target.value)}
                      placeholder="blurry, distorted, low resolution..."
                      disabled={isGenerating}
                    />
                  </div>

                  <Button
                    onClick={handleAIGenerate}
                    className="w-full flex items-center justify-center gap-2"
                    disabled={isGenerating || !aiPrompt.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("editor.aiGenerating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t("editor.aiGenerate")}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-muted/20 flex items-center justify-center overflow-auto p-8" ref={containerRef}>
          <div
            className="bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
            }}
            ref={canvasContainerRef}
          />
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-72 border-l bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm">{t("editor.properties")}</h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Zoom Control */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    {t("editor.zoom")}: {zoom}%
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => handleZoom(v)}
                    min={25}
                    max={200}
                    step={5}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleZoom(50)}>
                      50%
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleZoom(100)}>
                      100%
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleZoom(150)}>
                      150%
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Object Controls */}
              {selectedObject && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Move className="w-4 h-4" />
                      {t("editor.selectedObject")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={bringForward}>
                        <ArrowUp className="w-4 h-4 mr-1" />
                        {t("editor.forward")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={sendBackward}>
                        <ArrowDown className="w-4 h-4 mr-1" />
                        {t("editor.back")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={flipHorizontal}>
                        <FlipHorizontal className="w-4 h-4 mr-1" />
                        {t("editor.flipH")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={flipVertical}>
                        <FlipVertical className="w-4 h-4 mr-1" />
                        {t("editor.flipV")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={duplicateSelected}>
                        <Copy className="w-4 h-4 mr-1" />
                        {t("editor.duplicate")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={deleteSelected}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t("editor.delete")}
                      </Button>
                    </div>

                    {/* Photo specific controls */}
                    {(selectedObject.type === "image" || selectedObject instanceof fabric.FabricImage) && !(selectedObject as any).isFrame && (
                      <div className="space-y-4 pt-3 border-t mt-3">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <Label className="text-xs">Zoom de la photo</Label>
                            <span className="text-muted-foreground">{selectedObjectScale}%</span>
                          </div>
                          <Slider
                            value={[selectedObjectScale]}
                            min={10}
                            max={300}
                            step={1}
                            onValueChange={([val]) => handleObjectScaleChange(val)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <Label className="text-xs">Rotation</Label>
                            <span className="text-muted-foreground">{selectedObjectAngle}°</span>
                          </div>
                          <Slider
                            value={[selectedObjectAngle]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={([val]) => handleObjectAngleChange(val)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Ajustement & Recadrage</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={fitPhoto} className="text-xs">
                              Ajuster (Fit)
                            </Button>
                            <Button variant="outline" size="sm" onClick={fillPhoto} className="text-xs">
                              Remplir (Fill)
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              selectedObject.set({ left: (selectedObject.left || 0) - 10 });
                              fabricRef.current?.renderAll();
                              saveState();
                            }} className="h-8">←</Button>
                            <div className="flex flex-col gap-1">
                              <Button variant="outline" size="sm" onClick={() => {
                                selectedObject.set({ top: (selectedObject.top || 0) - 10 });
                                fabricRef.current?.renderAll();
                                saveState();
                              }} className="h-4 py-0 text-[10px]">▲</Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                selectedObject.set({ top: (selectedObject.top || 0) + 10 });
                                fabricRef.current?.renderAll();
                                saveState();
                              }} className="h-4 py-0 text-[10px]">▼</Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                              selectedObject.set({ left: (selectedObject.left || 0) + 10 });
                              fabricRef.current?.renderAll();
                              saveState();
                            }} className="h-8">→</Button>
                          </div>
                          
                          <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => {
                            if (fabricRef.current) {
                              const canvasWidth = fabricRef.current.width || CANVAS_SIZE
                              const canvasHeight = fabricRef.current.height || CANVAS_SIZE
                              selectedObject.set({
                                left: canvasWidth / 2,
                                top: canvasHeight / 2,
                              });
                              selectedObject.setCoords();
                              fabricRef.current.renderAll();
                              saveState();
                            }
                          }}>
                            Centrer la photo
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Canvas Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {t("editor.canvas")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={autoCropToFrame}>
                    <Crop className="w-4 h-4 mr-2" />
                    {t("editor.autoCrop")}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={resetCanvas}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t("editor.clearCanvas")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}

