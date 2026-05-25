import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Layers, Type, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import type { Frame, Category } from "@/lib/types"

interface EditorSidebarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  categories: Category[]
  filteredFrames: Frame[]
  addFrameToCanvas: (url: string) => void
  textOptions: any
  setTextOptions: React.Dispatch<React.SetStateAction<any>>
  addText: (options: any, t: any) => void
  session: any
  aiCredits: number | null
  aiCreditsTotal: number | null
  aiPrompt: string
  setAiPrompt: (p: string) => void
  aiStyle: string
  setAiStyle: (s: string) => void
  aiNegativePrompt: string
  setAiNegativePrompt: (p: string) => void
  isGenerating: boolean
  handleAIGenerate: () => void
}

export function EditorSidebar({
  fileInputRef,
  handleFileUpload,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredFrames,
  addFrameToCanvas,
  textOptions,
  setTextOptions,
  addText,
  session,
  aiCredits,
  aiCreditsTotal,
  aiPrompt,
  setAiPrompt,
  aiStyle,
  setAiStyle,
  aiNegativePrompt,
  setAiNegativePrompt,
  isGenerating,
  handleAIGenerate
}: EditorSidebarProps) {
  const { t } = useI18n()

  return (
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
                  <p className="text-sm text-muted-foreground">{t("editor.clickUpload")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("editor.fileTypes")}</p>
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
                  onChange={(e) => setTextOptions((o: any) => ({ ...o, text: e.target.value }))}
                  placeholder={t("editor.enterText")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t("editor.fontSize")}: {textOptions.fontSize}px</Label>
                <Slider
                  value={[textOptions.fontSize]}
                  onValueChange={([v]) => setTextOptions((o: any) => ({ ...o, fontSize: v }))}
                  min={12}
                  max={120}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t("editor.font")}</Label>
                <Select
                  value={textOptions.fontFamily}
                  onValueChange={(v) => setTextOptions((o: any) => ({ ...o, fontFamily: v }))}
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
                    onChange={(e) => setTextOptions((o: any) => ({ ...o, fill: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={textOptions.fill}
                    onChange={(e) => setTextOptions((o: any) => ({ ...o, fill: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button onClick={() => addText(textOptions, t)} className="w-full">
                <Type className="w-4 h-4 mr-2" />
                {t("editor.addText")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="p-4 mt-0 space-y-4">
            <div className="space-y-4">
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
  )
}
