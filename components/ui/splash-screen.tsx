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
    try {
      const hasSeen = sessionStorage.getItem("hasSeenSplash")
      if (!hasSeen) {
        setShow(true)
      }
    } catch {
      // Ignore sessionStorage errors in iOS Private Browsing / restricted WebViews
    }
  }, [])

  useEffect(() => {
    if (!show || !mounted) return

    // Trigger single CSS transition instead of 15ms React state intervals (prevents iOS WebKit crash)
    const startTimer = setTimeout(() => setProgress(100), 50)
    const endTimer = setTimeout(() => {
      setShow(false)
      try {
        sessionStorage.setItem("hasSeenSplash", "true")
      } catch {
        // Ignore storage restrictions
      }
    }, 950)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(endTimer)
    }
  }, [show, mounted])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black overflow-hidden select-none"
        >
          {/* Lightweight background glow (safe on iOS WebKit GPU) */}
          <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-rose-500/10 blur-[80px] pointer-events-none" />
          <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-rose-600/10 blur-[80px] pointer-events-none" />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md mx-4 bg-zinc-950/90 md:backdrop-blur-xl border border-zinc-800/40 shadow-2xl rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
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

              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-baseline gap-1">
                  Event <span className="text-rose-500">Frames</span>
                </h1>
              </div>
            </div>

            <div className="mt-8 relative z-10">
              <div className="flex items-end justify-between mb-2">
                <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  READY
                </span>
                <span className="text-xl font-extrabold font-mono text-rose-500">
                  {progress}%
                </span>
              </div>

              <div className="w-full h-2 bg-zinc-900/90 rounded-full border border-zinc-800/30 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-rose-600 via-rose-500 to-rose-400 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
