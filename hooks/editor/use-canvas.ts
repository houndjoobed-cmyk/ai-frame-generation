import { useEffect, useRef, useState, useCallback } from "react"
import * as fabric from "fabric"
import { toast } from "sonner"

export function useCanvas(CANVAS_SIZE: number) {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const isTrackingRef = useRef(true)
  const [canvasReady, setCanvasReady] = useState(false)
  const [zoom, setZoom] = useState(100)

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

    fabricRef.current = canvas
    setCanvasReady(true)

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
    fabricRef.current.setZoom(value / 100)
    fabricRef.current.renderAll()
  }, [])

  const resetCanvas = useCallback((saveState: () => void, t: any) => {
    if (!fabricRef.current) return
    fabricRef.current.clear()
    fabricRef.current.backgroundColor = "#ffffff"
    fabricRef.current.renderAll()
    saveState()
    toast.success(t("editor.toast.canvasCleared"))
  }, [])

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

    fabricRef.current.setDimensions({ width: newWidth, height: newHeight })

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
  }, [CANVAS_SIZE])

  const addText = useCallback((textOptions: any, t: any) => {
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
  }, [CANVAS_SIZE])

  return {
    canvasContainerRef,
    fabricRef,
    isTrackingRef,
    canvasReady,
    zoom,
    enforceFrameProperties,
    handleZoom,
    resetCanvas,
    autoCropToFrame,
    addText
  }
}
