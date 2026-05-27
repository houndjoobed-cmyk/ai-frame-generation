import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Undo,
  Redo,
  Layers,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Crop
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import * as fabric from "fabric"

interface EditorToolbarProps {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  selectedObject: fabric.FabricObject | null
  bringForward: (obj: fabric.FabricObject | null) => void
  sendBackward: (obj: fabric.FabricObject | null) => void
  flipHorizontal: () => void
  flipVertical: () => void
  duplicateSelected: () => void
  deleteSelected: () => void
  zoom: number
  handleZoom: (value: number) => void
  autoCropToFrame: (saveState: () => void, t: any) => void
  saveState: () => void
}

export function EditorToolbar({
  canUndo,
  canRedo,
  undo,
  redo,
  selectedObject,
  bringForward,
  sendBackward,
  flipHorizontal,
  flipVertical,
  duplicateSelected,
  deleteSelected,
  zoom,
  handleZoom,
  autoCropToFrame,
  saveState
}: EditorToolbarProps) {
  const { t } = useI18n()

  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10 w-full overflow-x-auto shadow-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
          className="hover:bg-gray-100"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
          className="hover:bg-gray-100"
        >
          <Redo className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => bringForward(selectedObject)}
          disabled={!selectedObject}
          title="Bring Forward"
          className="hover:bg-gray-100"
        >
          <Layers className="w-4 h-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Up</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => sendBackward(selectedObject)}
          disabled={!selectedObject}
          title="Send Backward"
          className="hover:bg-gray-100"
        >
          <Layers className="w-4 h-4 mr-0 sm:mr-2 rotate-180" />
          <span className="hidden sm:inline">Down</span>
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={flipHorizontal}
          disabled={!selectedObject}
          title="Flip Horizontal"
          className="hover:bg-gray-100"
        >
          <FlipHorizontal className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={flipVertical}
          disabled={!selectedObject}
          title="Flip Vertical"
          className="hover:bg-gray-100"
        >
          <FlipVertical className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => autoCropToFrame(saveState, t)}
          title="Crop to Frame"
          className="hover:bg-gray-100 text-orange-600 border-orange-200 hover:text-orange-700"
        >
          <Crop className="w-4 h-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Crop Canvas to Frame</span>
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={duplicateSelected}
          disabled={!selectedObject}
          title="Duplicate"
          className="hover:bg-gray-100"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={deleteSelected}
          disabled={!selectedObject}
          title="Delete"
          className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 border"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="hidden md:flex items-center gap-4 min-w-[200px]">
        <ZoomOut className="w-4 h-4 text-gray-500" />
        <Slider
          value={[zoom]}
          min={10}
          max={200}
          step={1}
          onValueChange={(val) => handleZoom(val[0])}
          className="w-32"
        />
        <span className="text-sm text-gray-500 w-12">{zoom}%</span>
        <ZoomIn className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  )
}
