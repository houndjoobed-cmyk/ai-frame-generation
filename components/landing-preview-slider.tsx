"use client"

import React, { useState, useRef, useEffect } from "react"
import { Sparkles, MoveHorizontal } from "lucide-react"

export function LandingPreviewSlider() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      setContainerWidth(containerRef.current?.getBoundingClientRect().width || 0)
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("touchend", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging])

  // Sample photo of people celebrating
  const basePhoto = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop"

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8">
      <div 
        ref={containerRef}
        className="relative aspect-video rounded-2xl border-2 border-border/80 shadow-2xl overflow-hidden select-none bg-muted group cursor-ew-resize"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsDragging(true)
          handleMove(e.clientX)
        }}
        onTouchStart={(e) => {
          setIsDragging(true)
          handleMove(e.touches[0].clientX)
        }}
      >
        {/* BEFORE IMAGE (No Frame) */}
        <div className="absolute inset-0">
          <img 
            src={basePhoto} 
            alt="Before event framing"
            className="w-full h-full object-cover pointer-events-none filter grayscale contrast-125 brightness-90"
          />
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-border shadow-sm">
            Sans Cadre (Original)
          </div>
        </div>

        {/* AFTER IMAGE (With Beautiful Frame Overlaid) */}
        <div 
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div 
            className="absolute inset-y-0 left-0 aspect-video"
            style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
          >
            <img 
              src={basePhoto} 
              alt="After event framing"
              className="w-full h-full object-cover pointer-events-none"
            />
            {/* The SVG Photo Frame Overlay */}
            <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-between pointer-events-none">
              {/* Elegant Gold Border and Corners */}
              <div className="absolute inset-3 border-2 border-amber-500/60 rounded-xl" />
              <div className="absolute inset-4 border border-amber-500/30 rounded-lg" />
              
              {/* Golden Corner Ornaments */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

              {/* Event Header */}
              <div className="relative z-10 text-center mt-4">
                <span className="bg-black/40 backdrop-blur-sm border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-semibold shadow-lg">
                  ✨ Gala de Charité 2026
                </span>
              </div>

              {/* Event Footer */}
              <div className="relative z-10 text-center mb-4">
                <h4 className="text-xl sm:text-3xl font-serif text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                  Une Soirée Inoubliable
                </h4>
                <p className="text-[10px] sm:text-xs text-amber-200 uppercase tracking-widest mt-1 font-medium drop-shadow-md">
                  Palais des Congrès • 20 Mai 2026
                </p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Cadre Appliqué
          </div>
        </div>

        {/* DRAG HANDLE BAR */}
        <div 
          className="absolute inset-y-0 w-1 bg-primary cursor-ew-resize flex items-center justify-center z-20 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground border-2 border-background shadow-xl flex items-center justify-center absolute hover:scale-110 transition-transform">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      {/* Slider Hint */}
      <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">
        Faites glisser le curseur pour voir la transformation en direct !
      </p>
    </div>
  )
}
