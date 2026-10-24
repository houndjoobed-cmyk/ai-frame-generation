"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { 
  Download, 
  Facebook, 
  Twitter, 
  Link2, 
  Check, 
  Sparkles, 
  ArrowRight, 
  MessageSquare,
  Camera
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

interface SharePageContentProps {
  exportData: {
    id: string
    file_url: string
  }
  frameId?: string | null
}

export function SharePageContent({ exportData, frameId }: SharePageContentProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/share/${exportData.id}` 
    : ""
  const shareText = `Regardez la photo encadrée que j'ai créée avec Event Frames !`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success(t("editor.toast.shareSuccess") || "Lien copié !")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error(t("editor.toast.shareFailed") || "Impossible de copier le lien.")
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(exportData.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `digital-frame-${exportData.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success("Téléchargement commencé !")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Échec du téléchargement.")
    }
  }

  // Social Links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl flex-1 flex flex-col justify-center relative">
      {/* Sleek Gradient Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Image Presentation */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative group w-full max-w-[500px]">
            {/* Glowing neon border effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-primary to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
            
            <Card className="relative bg-black/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full">
              <CardContent className="p-3">
                <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img
                    src={exportData.file_url}
                    alt="Photo encadrée"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Action: Add your photo in this frame */}
          <Link href={frameId ? `/editor?frame=${frameId}` : "/editor"} className="mt-6 w-full max-w-[500px] block">
            <Button 
              className="w-full h-13 bg-linear-to-r from-emerald-500 via-primary to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold text-base rounded-xl shadow-xl shadow-primary/25 gap-2 transition-all duration-300 hover:scale-[1.01]"
            >
              <Camera className="w-5 h-5 animate-pulse" />
              Mettre ma photo dans ce cadre
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>
          </Link>

          <Button 
            onClick={handleDownload} 
            variant="outline"
            className="mt-3 w-full max-w-[500px] h-11 bg-slate-900/60 border-slate-700 hover:bg-slate-800 text-slate-200 font-medium gap-2 text-sm rounded-xl"
          >
            <Download className="w-4 h-4" />
            {t("editor.downloadPng") || "Télécharger l'image"}
          </Button>
        </div>

        {/* Right Column: Interaction details */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              {t("home.badge") || "Cadre généré"}
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {t("editor.shareTitle") || "Votre cadre est prêt !"}
            </h1>
            <p className="text-slate-400 text-base max-w-md mx-auto lg:mx-0">
              {t("editor.shareDesc") || "Téléchargez votre création ou partagez-la directement avec vos proches sur les réseaux sociaux."}
            </p>
          </div>

          {/* Social shares and link copy */}
          <div className="space-y-4">
            {/* Copy link bar */}
            <div className="flex gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <div className="flex-1 flex items-center px-3 overflow-hidden">
                <span className="text-xs text-slate-500 truncate select-all">{shareUrl}</span>
              </div>
              <Button
                onClick={handleCopyLink}
                variant="secondary"
                className="h-10 px-4 rounded-lg flex items-center gap-2 font-medium shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 border-none"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                {copied ? "Copié !" : (t("editor.copyLink") || "Copier")}
              </Button>
            </div>

            {/* Social direct buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-medium transition-all shadow-md hover:shadow-emerald-500/10"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                WhatsApp
              </a>
              <a 
                href={facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#1877F2] hover:bg-[#156bec] text-white font-medium transition-all shadow-md hover:shadow-blue-500/10"
              >
                <Facebook className="w-4 h-4 fill-white" />
                Facebook
              </a>
              <a 
                href={twitterUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-medium transition-all shadow-md hover:shadow-sky-500/10"
              >
                <Twitter className="w-4 h-4 fill-white" />
                Twitter
              </a>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* CTA: Create your own or use this frame */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-md space-y-4">
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Vous aussi, ajoutez votre photo !
            </h3>
            <p className="text-xs text-slate-400">
              {frameId
                ? "Personnalisez ce même cadre avec votre photo en quelques secondes et partagez votre création."
                : "Transformez vos propres photos avec nos modèles exclusifs ou créez de nouveaux styles à l'aide de l'Intelligence Artificielle."}
            </p>
            <Link href={frameId ? `/editor?frame=${frameId}` : "/editor"} className="block">
              <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 font-semibold shadow-md">
                <Camera className="w-4 h-4" />
                {frameId ? "Ajouter ma photo dans ce cadre" : "Lancer l'Éditeur"}
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
