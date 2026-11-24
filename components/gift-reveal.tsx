"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { ChevronLeft, ChevronUp } from "lucide-react"
import Snowfall from "@/components/snowfall"
import confetti from "canvas-confetti"

interface GiftRevealProps {
  gift: {
    day: number
    dayName: string
    title: string
    fullDescription: string
    specialNote?: string
    image?: string
  }
  onBack: () => void
  onReveal: () => void
  openedGiftsCount?: number
  totalGifts?: number
  year?: number
}

const REVEAL_THRESHOLD = 150
const MAX_DRAG = 300

export function GiftReveal({ gift, onBack, onReveal, openedGiftsCount = 0, totalGifts = 0, year }: GiftRevealProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const startPosRef = useRef(0)
  const dragOffsetRef = useRef(0)

  const progress = Math.min(dragOffset / REVEAL_THRESHOLD, 1)

  const handleDragStart = (clientY: number) => {
    if (isRevealed) return
    setIsDragging(true)
    startPosRef.current = clientY
  }

  const fireConfetti = useCallback(() => {
    const colors = ["#fcd34d", "#f59e0b", "#ef4444", "#ffffff", "#fda4af"]
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 }, colors, scalar: 0.9 })
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
      confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
    }, 180)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const move = (clientY: number) => {
      const diff = startPosRef.current - clientY
      const next = diff > 0 ? Math.min(diff, MAX_DRAG) : 0
      dragOffsetRef.current = next
      setDragOffset(next)
    }
    const end = () => {
      setIsDragging(false)
      if (dragOffsetRef.current > REVEAL_THRESHOLD) {
        setIsRevealed(true)
        fireConfetti()
        setTimeout(onReveal, 900)
      } else {
        dragOffsetRef.current = 0
        setDragOffset(0)
      }
    }
    const handleMouseMove = (e: MouseEvent) => move(e.clientY)
    const handleTouchMove = (e: TouchEvent) => move(e.touches[0].clientY)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", end)
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", end)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", end)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", end)
    }
  }, [isDragging, onReveal, fireConfetti])

  return (
    <div className="min-h-screen overflow-hidden bg-wine-gradient animate-page-in">
      <Snowfall />
      <Navbar openedGiftsCount={openedGiftsCount} totalGifts={totalGifts} year={year} />

      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full space-y-4 sm:space-y-5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 -ml-3 text-amber-200 hover:text-amber-100 hover:bg-white/5 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft size={18} />
            Volver
          </button>

          <div className="relative overflow-hidden rounded-xl min-h-[420px] sm:min-h-[500px] h-[70vh] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)]">
            {/* Vista previa del regalo detrás */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-red-800 to-red-950 z-0 transition-transform duration-700"
              style={{
                backgroundImage: gift.image ? `url(${gift.image})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `scale(${isRevealed ? 1 : 1.08 - progress * 0.08})`,
              }}
            >
              <div
                className="absolute inset-0 bg-black transition-opacity duration-500"
                style={{ opacity: isRevealed ? 0.1 : 0.55 - progress * 0.3 }}
              />
            </div>

            {/* Carta de Johan (deslizable) */}
            <div
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 select-none touch-none cursor-grab active:cursor-grabbing ${
                isRevealed ? "opacity-0 scale-95" : "opacity-100"
              } ${isDragging ? "" : "transition-all duration-500 ease-out"}`}
              style={{
                background: "linear-gradient(165deg, rgba(127,29,29,0.94) 0%, rgba(69,10,10,0.96) 100%)",
                transform: `translateY(-${isRevealed ? 120 : dragOffset}px)`,
                borderRadius: "0.75rem",
              }}
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
            >
              {/* Doble borde dorado tipo carta */}
              <div className="pointer-events-none absolute inset-3 rounded-lg border border-amber-200/45" aria-hidden />
              <div className="pointer-events-none absolute inset-[18px] rounded-md border border-amber-200/20" aria-hidden />
              {/* Esquinas */}
              {["top-5 left-5", "top-5 right-5", "bottom-5 left-5", "bottom-5 right-5"].map((pos) => (
                <span key={pos} className={`pointer-events-none absolute ${pos} text-amber-300/60 text-xs`} aria-hidden>
                  ✦
                </span>
              ))}

              <div className="relative text-center space-y-5 sm:space-y-6 max-w-lg">
                {/* Sello */}
                <div
                  className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-xl sm:text-2xl"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, #f87171, #991b1b 70%)",
                    boxShadow: "0 3px 0 #5b0f0f, 0 6px 14px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.35)",
                  }}
                  aria-hidden
                >
                  ❤
                </div>

                <p className="text-amber-300 uppercase text-xs sm:text-sm tracking-[0.25em] font-semibold">
                  {gift.dayName} {gift.day} de Diciembre
                </p>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white text-gold-glow leading-tight">
                  {gift.title}
                </h1>

                <p className="text-red-100/95 text-sm sm:text-base lg:text-lg leading-relaxed">{gift.fullDescription}</p>

                {gift.specialNote && (
                  <div
                    className="relative rounded-md px-5 py-4 mt-2"
                    style={{
                      background: "linear-gradient(170deg, #fffbeb, #fef3c7)",
                      boxShadow: "0 8px 18px -8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(217,119,6,0.35)",
                      rotate: "-0.6deg",
                    }}
                  >
                    <p className="text-amber-900 text-xs sm:text-sm italic text-center leading-relaxed">“{gift.specialNote}”</p>
                  </div>
                )}

                {/* Indicador de deslizar con progreso */}
                <div className="pt-6 sm:pt-8 border-t border-amber-400/25">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-amber-200 text-sm font-semibold">
                      {progress >= 1 ? "¡Suelta para abrir! 🎁" : "Desliza hacia arriba para ver tu regalo"}
                    </p>
                    <div className={progress > 0 ? "" : "animate-bounce"}>
                      <ChevronUp size={30} className="text-amber-400" />
                    </div>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-200"
                        style={{
                          width: `${progress * 100}%`,
                          transition: isDragging ? "none" : "width 0.4s ease-out",
                          boxShadow: progress >= 1 ? "0 0 10px rgba(252,211,77,0.9)" : "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
