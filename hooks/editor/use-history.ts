import { useCallback, useState } from "react"
import * as fabric from "fabric"

export function useHistory(
  fabricRef: React.MutableRefObject<fabric.Canvas | null>,
  isTrackingRef: React.MutableRefObject<boolean>,
  CUSTOM_PROPS: string[],
  enforceFrameProperties: (canvas: fabric.Canvas) => void
) {
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  const saveState = useCallback(() => {
    if (!fabricRef.current || !isTrackingRef.current) return
    const json = JSON.stringify((fabricRef.current as any).toJSON(CUSTOM_PROPS))
    setUndoStack((prev) => [...prev.slice(-19), json])
    setRedoStack([])
  }, [fabricRef, isTrackingRef, CUSTOM_PROPS])

  const initHistory = useCallback((json: string) => {
    setUndoStack([json])
    setRedoStack([])
  }, [])

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
  }, [undoStack, fabricRef, isTrackingRef, enforceFrameProperties])

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
  }, [redoStack, fabricRef, isTrackingRef, enforceFrameProperties])

  return {
    undoStack,
    redoStack,
    saveState,
    initHistory,
    undo,
    redo,
    canUndo: undoStack.length > 1,
    canRedo: redoStack.length > 0
  }
}
