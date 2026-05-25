import { useState, useCallback, useEffect } from "react"
import * as fabric from "fabric"

export function useSelection(
  fabricRef: React.MutableRefObject<fabric.Canvas | null>,
  saveState: () => void
) {
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
  const [selectedObjectScale, setSelectedObjectScale] = useState(100)
  const [selectedObjectAngle, setSelectedObjectAngle] = useState(0)

  useEffect(() => {
    if (!fabricRef.current) return

    const canvas = fabricRef.current

    const handleSelectionCreated = (e: any) => {
      const obj = e.selected?.[0] || null
      setSelectedObject(obj)
      if (obj) {
        setSelectedObjectScale(Math.round((obj.scaleX || 1) * 100))
        setSelectedObjectAngle(Math.round(obj.angle || 0))
      }
    }

    const handleSelectionUpdated = (e: any) => {
      const obj = e.selected?.[0] || null
      setSelectedObject(obj)
      if (obj) {
        setSelectedObjectScale(Math.round((obj.scaleX || 1) * 100))
        setSelectedObjectAngle(Math.round(obj.angle || 0))
      }
    }

    const handleSelectionCleared = () => {
      setSelectedObject(null)
    }

    const handleObjectModified = (e: any) => {
      const obj = e.target
      if (obj && obj === canvas.getActiveObject()) {
        setSelectedObjectScale(Math.round((obj.scaleX || 1) * 100))
        setSelectedObjectAngle(Math.round(obj.angle || 0))
      }
      saveState()
    }

    canvas.on("selection:created", handleSelectionCreated)
    canvas.on("selection:updated", handleSelectionUpdated)
    canvas.on("selection:cleared", handleSelectionCleared)
    canvas.on("object:modified", handleObjectModified)

    return () => {
      canvas.off("selection:created", handleSelectionCreated)
      canvas.off("selection:updated", handleSelectionUpdated)
      canvas.off("selection:cleared", handleSelectionCleared)
      canvas.off("object:modified", handleObjectModified)
    }
  }, [fabricRef, saveState])

  const handleScaleChange = useCallback((value: number) => {
    if (!selectedObject || !fabricRef.current) return
    const scale = value / 100
    selectedObject.scale(scale)
    fabricRef.current.renderAll()
    setSelectedObjectScale(value)
    saveState()
  }, [selectedObject, fabricRef, saveState])

  const handleAngleChange = useCallback((value: number) => {
    if (!selectedObject || !fabricRef.current) return
    selectedObject.set("angle", value)
    fabricRef.current.renderAll()
    setSelectedObjectAngle(value)
    saveState()
  }, [selectedObject, fabricRef, saveState])

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return
    fabricRef.current.remove(selectedObject)
    fabricRef.current.renderAll()
    setSelectedObject(null)
    saveState()
  }, [selectedObject, fabricRef, saveState])

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
      saveState()
    })
  }, [selectedObject, fabricRef, saveState])

  const flipHorizontal = useCallback(() => {
    if (!selectedObject || !fabricRef.current) return
    selectedObject.set("flipX", !selectedObject.flipX)
    fabricRef.current.renderAll()
    saveState()
  }, [selectedObject, fabricRef, saveState])

  const flipVertical = useCallback(() => {
    if (!selectedObject || !fabricRef.current) return
    selectedObject.set("flipY", !selectedObject.flipY)
    fabricRef.current.renderAll()
    saveState()
  }, [selectedObject, fabricRef, saveState])

  return {
    selectedObject,
    selectedObjectScale,
    selectedObjectAngle,
    handleScaleChange,
    handleAngleChange,
    deleteSelected,
    duplicateSelected,
    flipHorizontal,
    flipVertical
  }
}
