import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  ZoomIn,
  Move,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Trash2,
  Palette,
  Crop,
  RotateCcw
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import * as fabric from "fabric"

interface EditorPropertiesProps {
  zoom: number
  handleZoom: (value: number) => void
  selectedObject: fabric.FabricObject | null
  selectedObjectScale: number
  selectedObjectAngle: number
  bringForward: (obj: fabric.FabricObject | null) => void
  sendBackward: (obj: fabric.FabricObject | null) => void
  flipHorizontal: () => void
  flipVertical: () => void
  duplicateSelected: () => void
  deleteSelected: () => void
  handleObjectScaleChange: (val: number) => void
  handleObjectAngleChange: (val: number) => void
  fitPhoto?: () => void
  fillPhoto?: () => void
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  CANVAS_SIZE: number
  saveState: () => void
  autoCropToFrame: (saveState: () => void, t: any) => void
  resetCanvas: (saveState: () => void, t: any) => void
  className?: string
  onBackToEditor?: () => void
}

export function EditorProperties({
  zoom,
  handleZoom,
  selectedObject,
  selectedObjectScale,
  selectedObjectAngle,
  bringForward,
  sendBackward,
  flipHorizontal,
  flipVertical,
  duplicateSelected,
  deleteSelected,
  handleObjectScaleChange,
  handleObjectAngleChange,
  fitPhoto,
  fillPhoto,
  fabricRef,
  CANVAS_SIZE,
  saveState,
  autoCropToFrame,
  resetCanvas,
  className,
  onBackToEditor
}: EditorPropertiesProps) {
  const { t } = useI18n()

  return (
    <aside className={`w-full md:w-72 border-l bg-muted/30 flex flex-col ${className || ""}`}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">{t("editor.properties")}</h3>
        {onBackToEditor && (
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-rose-500 font-semibold px-2 py-1 h-auto hover:bg-transparent"
            onClick={onBackToEditor}
          >
            ✓ Valider
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
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
                  <Button variant="outline" size="sm" onClick={() => bringForward(selectedObject)}>
                    <ArrowUp className="w-4 h-4 mr-1" />
                    {t("editor.forward")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => sendBackward(selectedObject)}>
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
                      {fitPhoto && fillPhoto && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={fitPhoto} className="text-xs">
                            Ajuster (Fit)
                          </Button>
                          <Button variant="outline" size="sm" onClick={fillPhoto} className="text-xs">
                            Remplir (Fill)
                          </Button>
                        </div>
                      )}
                      
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t("editor.canvas")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => autoCropToFrame(saveState, t)}>
                <Crop className="w-4 h-4 mr-2" />
                {t("editor.autoCrop")}
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => resetCanvas(saveState, t)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("editor.clearCanvas")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  )
}
