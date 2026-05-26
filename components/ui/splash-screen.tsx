"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check sessionStorage to see if the user already saw the splash screen in this session
    const hasSeen = sessionStorage.getItem("hasSeenSplash")
    if (!hasSeen) {
      setShow(true)
    }
  }, [])

  useEffect(() => {
    if (!show || !mounted) return

    const duration = 1200 // 1.2s total loading time
    const intervalTime = 15 // update every 15ms
    const step = 100 / (duration / intervalTime)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          // Hide splash screen after progress bar is full and short delay
          setTimeout(() => {
            setShow(false)
            sessionStorage.setItem("hasSeenSplash", "true")
          }, 300)
          return 100
        }
        return Math.min(prev + step, 100)
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [show, mounted])

  // Prevent rendering during SSR or if the user has already seen the splash
  if (!mounted) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black overflow-hidden select-none"
        >
          {/* Neon glowing halos in the background */}
          <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />

          {/* Glassmorphic card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md mx-4 bg-zinc-950/40 backdrop-blur-xl border border-zinc-800/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl p-6 relative overflow-hidden"
          >
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none rounded-2xl" />

            <div className="flex items-center gap-4 relative z-10">
              {/* Logo container */}
              <div className="relative w-12 h-12 bg-black/60 rounded-xl flex items-center justify-center p-1 border border-zinc-800/50 shadow-inner">
                <Image
                  src="/logo-square.png"
                  alt="Event Frames Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-lg"
                  priority
                />
              </div>

              {/* Text branding */}
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-baseline gap-1">
                  Event <span className="text-rose-500">Frames</span>
                </h1>
              </div>
            </div>

            {/* Loading details */}
            <div className="mt-8 relative z-10">
              <div className="flex items-end justify-between mb-2">
                <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  READY
                </span>
                <span className="text-xl font-extrabold font-mono text-rose-500">
                  {Math.floor(progress)}%
                </span>
              </div>

              {/* Progress bar track */}
              <div className="w-full h-2 bg-zinc-900/90 rounded-full border border-zinc-800/30 overflow-hidden shadow-inner">
                {/* Animating progress bar fill */}
                <div
                  className="h-full bg-linear-to-r from-rose-600 via-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,39,94,0.5)] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Pulsing loading dots */}
            <div className="mt-6 flex justify-start gap-1 relative z-10">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-1.5 h-1.5 bg-rose-500 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
