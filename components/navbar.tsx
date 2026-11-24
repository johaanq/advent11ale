"use client"

import { useState, useEffect, memo } from "react"
import { Gift, CalendarHeart } from "lucide-react"

interface NavbarProps {
  openedGiftsCount?: number
  totalGifts?: number
  onShowOpenedGifts?: () => void
}

export const Navbar = memo(function Navbar({ openedGiftsCount = 0, totalGifts = 4, onShowOpenedGifts }: NavbarProps) {
  const [currentDate, setCurrentDate] = useState("")
  const [shortDate, setShortDate] = useState("")
  const [daysUntilBirthday, setDaysUntilBirthday] = useState(0)

  useEffect(() => {
    const updateDate = () => {
      const today = new Date()
      setCurrentDate(
        today.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", weekday: "long" })
      )
      setShortDate(today.toLocaleDateString("es-ES", { day: "numeric", month: "short" }))

      // Calcular días hasta cumpleaños
      const birthdayDate = new Date(2025, 11, 11)
      const days = Math.ceil((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      setDaysUntilBirthday(days > 0 ? days : 0)
    }

    updateDate()
    const interval = setInterval(updateDate, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [])

  const progress = totalGifts > 0 ? openedGiftsCount / totalGifts : 0

  return (
    <nav className="relative z-50 w-full px-3 py-2 sm:px-5 sm:py-3 bg-wine/90 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-1.5 sm:gap-4">
        {/* Lado izquierdo */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 w-full sm:w-auto justify-between sm:justify-start">
          {/* Fecha de hoy */}
          <span className="text-red-100/90 text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide text-shadow-soft">
            <span className="hidden sm:inline">{currentDate}</span>
            <span className="sm:hidden">{shortDate}</span>
          </span>

          <span className="hidden sm:block h-5 w-px bg-white/15" />

          {/* Regalos abiertos */}
          <button
            type="button"
            onClick={() => onShowOpenedGifts?.()}
            disabled={!onShowOpenedGifts}
            className="group relative flex items-center gap-1.5 sm:gap-2 rounded-full border border-amber-200/25 bg-black/15 pl-2 pr-2.5 py-1 transition-all enabled:hover:border-amber-200/60 enabled:hover:bg-black/25 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:cursor-default"
            aria-label={`Regalos abiertos: ${openedGiftsCount} de ${totalGifts}`}
          >
            <Gift size={14} className="text-amber-300 transition-transform group-enabled:group-hover:-rotate-12" />
            <span className="text-red-100/90 text-[10px] sm:text-xs font-semibold uppercase tracking-wide hidden sm:inline">
              Regalos
            </span>
            <span className="text-white text-xs sm:text-sm font-bold tabular-nums">
              {openedGiftsCount}/{totalGifts}
            </span>
            {/* Mini barra de progreso */}
            <span className="absolute left-3 right-3 -bottom-px h-px overflow-hidden rounded-full">
              <span
                className="block h-full bg-amber-300 transition-all duration-700"
                style={{ width: `${progress * 100}%` }}
              />
            </span>
          </button>

          {/* Días restantes */}
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-black/10 px-2.5 py-1">
            <CalendarHeart size={14} className="text-rose-300" />
            <span className="text-red-100/90 text-[10px] sm:text-xs font-semibold uppercase tracking-wide hidden sm:inline">
              Días
            </span>
            <span className="text-white text-xs sm:text-sm font-bold tabular-nums">{daysUntilBirthday}</span>
          </div>
        </div>

        {/* Centro - Logo */}
        <div className="flex-1 flex justify-center w-full sm:w-auto order-first sm:order-none">
          <h1 className="font-display text-xl sm:text-2xl lg:text-[1.7rem] font-semibold tracking-wider drop-gold">
            <span className="text-shimmer">Advent11Ale</span>
          </h1>
        </div>

        {/* Lado derecho */}
        <div className="hidden sm:flex items-center gap-3 lg:gap-4 justify-end">
          <span className="text-red-100/80 text-xs sm:text-sm font-semibold tabular-nums">2025</span>
          <span className="h-4 w-px bg-white/15" />
          <span className="text-red-100/80 text-xs sm:text-sm font-semibold">ES</span>
        </div>
      </div>

      {/* Línea dorada inferior */}
      <div className="gold-divider absolute inset-x-0 bottom-0" />
    </nav>
  )
})
