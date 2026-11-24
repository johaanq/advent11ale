"use client"

import { useState, useEffect, Fragment } from "react"
import Snowfall from "@/components/snowfall"

interface CountdownLockProps {
  targetDate: Date
  onUnlock: () => void
  // Botón para ver el año anterior mientras tanto
  archiveYear?: number
  onViewArchive?: () => void
}

const UNITS = [
  { key: "days", label: "Días" },
  { key: "hours", label: "Horas" },
  { key: "minutes", label: "Minutos" },
  { key: "seconds", label: "Segundos" },
] as const

export function CountdownLock({ targetDate, onUnlock, archiveYear, onViewArchive }: CountdownLockProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const difference = targetDate.getTime() - Date.now()

      if (difference <= 0) {
        setIsUnlocked(true)
        onUnlock()
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [targetDate, onUnlock])

  if (isUnlocked) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 sm:pt-12 lg:pt-16"
      style={{
        backgroundImage: "url(/snoopy_contador.gif)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Degradado superior para que el contador se lea sobre el GIF */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{ background: "linear-gradient(180deg, rgba(30,6,10,0.7) 0%, rgba(30,6,10,0.25) 60%, transparent 100%)" }}
        aria-hidden
      />
      <Snowfall />

      <div className="relative z-10 text-center px-3 sm:px-6 animate-slide-up">
        <p className="font-display text-amber-100 text-base sm:text-xl lg:text-2xl mb-4 sm:mb-6 tracking-wide text-gold-glow">
          Falta poquito… ✦
        </p>

        <div className="flex items-start justify-center gap-1.5 sm:gap-3 lg:gap-4">
          {UNITS.map((unit, i) => (
            <Fragment key={unit.key}>
              <div className="glass-wine rounded-xl px-2.5 py-2.5 sm:px-5 sm:py-4 lg:px-6 lg:py-5 min-w-[64px] sm:min-w-[96px] lg:min-w-[120px]">
                <div
                  key={timeLeft[unit.key]}
                  className="font-mono text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tabular-nums leading-none text-shadow-pixel animate-fadeIn"
                  style={{ animationDuration: "0.35s" }}
                >
                  {String(timeLeft[unit.key]).padStart(2, "0")}
                </div>
                <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-xs lg:text-sm text-amber-100/80 uppercase tracking-[0.18em] font-semibold">
                  {unit.label}
                </div>
              </div>
              {i < UNITS.length - 1 && (
                <span
                  className="font-mono font-bold self-center -mt-4 text-2xl sm:text-4xl lg:text-5xl text-amber-200/80 animate-blink-soft text-shadow-pixel"
                  aria-hidden
                >
                  :
                </span>
              )}
            </Fragment>
          ))}
        </div>

        {onViewArchive && archiveYear && (
          <button
            type="button"
            onClick={onViewArchive}
            className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-black/30 px-4 py-2 text-xs sm:text-sm text-amber-100 backdrop-blur-sm transition-colors hover:border-amber-200/80 hover:bg-black/45"
          >
            ✦ Mientras tanto, recordar {archiveYear}
          </button>
        )}
      </div>
    </div>
  )
}
