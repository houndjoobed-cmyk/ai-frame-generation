import { useEffect, useRef, useState, useCallback } from "react"
import * as fabric from "fabric"
import { toast } from "sonner"

export function useCanvas(CANVAS_SIZE: number) {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const isTrackingRef = useRef(true)
  const [canvasReady, setCanvasReady] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_SIZE)
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_SIZE)

  const updateDimensions = useCallback((width: number, height: number) => {
    if (!fabricRef.current) return
    fabricRef.current.setDimensions({ width, height })
    setCanvasWidth(width)
    setCanvasHeight(height)
  }, [])

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

  useEffect(() => {
    if (!canvasContainerRef.current) return

    const canvasEl = document.createElement("canvas")
    canvasContainerRef.current.appendChild(canvasEl)

    const canvas = new fabric.Canvas(canvasEl, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    })

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

    // Configure selection styles globally in Fabric for touch friendliness
    fabric.FabricObject.prototype.set({
      transparentCorners: false,
      cornerColor: "#EA9010", // Orange accent color
      cornerStrokeColor: "#ffffff",
      borderColor: "#9efd38", // Brand green color
      cornerSize: isMobile ? 22 : 12,
      touchCornerSize: isMobile ? 32 : 16,
      cornerStyle: "circle", // Circular Figma-like controls
      borderScaleFactor: 2,
      padding: 6,
    })

    fabricRef.current = canvas
    setCanvasReady(true)
    setCanvasWidth(CANVAS_SIZE)
    setCanvasHeight(CANVAS_SIZE)

    return () => {
      setCanvasReady(false)
      canvas.dispose()
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = ""
      }
    }
  }, [CANVAS_SIZE])

  const handleZoom = useCallback((value: number) => {
    if (!fabricRef.current) return
    setZoom(value)
    // We do NOT zoom the Fabric canvas internally because we scale the DOM element using CSS.
    // This maintains stable coordinates, avoids blur, and makes object selections perfectly aligned.
    fabricRef.current.renderAll()
  }, [])

  const resetCanvas = useCallback((saveState: () => void, t: any) => {
    if (!fabricRef.current) return
    fabricRef.current.clear()
    fabricRef.current.backgroundColor = "#ffffff"
    updateDimensions(CANVAS_SIZE, CANVAS_SIZE)
    fabricRef.current.renderAll()
    saveState()
    toast.success(t("editor.toast.canvasCleared"))
  }, [CANVAS_SIZE, updateDimensions])

  const autoCropToFrame = useCallback((saveState: () => void, t: any) => {
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

    updateDimensions(newWidth, newHeight)

    frameObj.set({
      left: newWidth / 2,
      top: newHeight / 2,
      scaleX: newWidth / frameWidth,
      scaleY: newWidth / frameWidth,
    })
    frameObj.setCoords()

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
  }, [CANVAS_SIZE, updateDimensions])

  const addText = useCallback((textOptions: any, t: any) => {
    if (!fabricRef.current) return

    const currentWidth = fabricRef.current.width || CANVAS_SIZE
    const currentHeight = fabricRef.current.height || CANVAS_SIZE

    const text = new fabric.IText(textOptions.text, {
      left: currentWidth / 2,
      top: currentHeight / 2,
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
  }, [CANVAS_SIZE])

  return {
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
  }
}
