import { useCallback } from "react"
import * as fabric from "fabric"

export function useLayers(
  fabricRef: React.MutableRefObject<fabric.Canvas | null>,
  saveState: () => void,
  enforceFrameProperties: (canvas: fabric.Canvas) => void
) {
  const bringForward = useCallback((selectedObject: fabric.FabricObject | null) => {
    if (!fabricRef.current || !selectedObject) return
    fabricRef.current.bringObjectForward(selectedObject)
    enforceFrameProperties(fabricRef.current)
    fabricRef.current.renderAll()
    saveState()
  }, [fabricRef, saveState, enforceFrameProperties])

  const sendBackward = useCallback((selectedObject: fabric.FabricObject | null) => {
    if (!fabricRef.current || !selectedObject) return
    fabricRef.current.sendObjectBackwards(selectedObject)
    enforceFrameProperties(fabricRef.current)
    fabricRef.current.renderAll()
    saveState()
  }, [fabricRef, saveState, enforceFrameProperties])

  return {
    bringForward,
    sendBackward
  }
}
