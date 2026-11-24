"use client"

import { useState, useEffect, memo } from "react"
import { BIRTHDAY_DAY, CURRENT_EDITION, limaNow } from "@/lib/editions"

interface NavbarProps {
  openedGiftsCount?: number
  totalGifts?: number
  onShowOpenedGifts?: () => void
  // Año que se está viendo y, opcionalmente, selector de año
  year?: number
  years?: number[]
  onYearChange?: (year: number) => void
}

// Separador fino dorado
function Dot() {
  return (
    <span className="text-amber-300/50 text-[10px] select-none" aria-hidden>
      ✦
    </span>
  )
}

function YearTabs({ year, years, onChange }: { year: number; years: number[]; onChange: (y: number) => void }) {
  return (
    <div role="tablist" aria-label="Año" className="flex items-center gap-3">
      {years.map((y) => {
        const active = y === year
        return (
          <button
            key={y}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !active && onChange(y)}
            className={`relative pb-0.5 font-serif text-[15px] sm:text-[17px] tabular-nums tracking-wide transition-colors focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-amber-200/70 ${
              active ? "font-semibold text-amber-100" : "font-medium text-red-100/55 hover:text-red-50"
            }`}
          >
            {y}
            <span
              className={`absolute inset-x-0 -bottom-0.5 h-px origin-center bg-gradient-to-r from-transparent via-amber-300 to-transparent transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}

export const Navbar = memo(function Navbar({
  openedGiftsCount = 0,
  totalGifts = 0,
  onShowOpenedGifts,
  year = CURRENT_EDITION.year,
  years,
  onYearChange,
}: NavbarProps) {
  const showSelector = Boolean(years && years.length > 1 && onYearChange)
  const [longDate, setLongDate] = useState("")
  const [shortDate, setShortDate] = useState("")
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const update = () => {
      const today = new Date()
      const long = today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
      setLongDate(long.charAt(0).toUpperCase() + long.slice(1))
      setShortDate(today.toLocaleDateString("es-ES", { day: "numeric", month: "long" }))

      // Días hasta el cumpleaños del año que se está viendo (en Lima)
      const now = limaNow(today)
      const todayUtc = Date.UTC(now.year, now.month - 1, now.day)
      const birthdayUtc = Date.UTC(year, 11, BIRTHDAY_DAY)
      setDaysLeft(Math.round((birthdayUtc - todayUtc) / 86400000))
    }
    update()
    const interval = setInterval(update, 1000 * 60 * 30)
    return () => clearInterval(interval)
  }, [year])

  const giftsLabel = `${openedGiftsCount} de ${totalGifts} regalos`
  const daysLabel =
    daysLeft === null || daysLeft < 0
      ? null
      : daysLeft === 0
        ? "¡Hoy es su día!"
        : daysLeft === 1
          ? "Falta 1 día"
          : `Faltan ${daysLeft} días`

  const giftsItem = onShowOpenedGifts ? (
    <button
      type="button"
      onClick={onShowOpenedGifts}
      className="group relative font-serif italic text-[15px] sm:text-[17px] text-red-50/90 transition-colors hover:text-amber-100 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-amber-200/70"
    >
      {giftsLabel}
      <span
        className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-amber-200/70 transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden
      />
    </button>
  ) : (
    <span className="font-serif italic text-[15px] sm:text-[17px] text-red-50/90">{giftsLabel}</span>
  )

  return (
    <nav className="relative z-50 w-full bg-wine/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-x-4 px-4 pt-2 pb-2.5 sm:px-6 sm:py-3">
        {/* Izquierda: fecha */}
        <p className="hidden sm:block font-serif italic text-[17px] text-red-100/75 truncate">{longDate}</p>
        <p className="sm:hidden font-serif italic text-[15px] text-red-100/75 truncate">{shortDate}</p>

        {/* Centro: logo */}
        <h1 className="flex items-center gap-2.5 sm:gap-3 leading-none">
          <span className="hidden sm:block h-px w-8 bg-gradient-to-r from-transparent to-amber-300/60" aria-hidden />
          <span className="font-script text-[1.9rem] sm:text-[2.35rem] text-amber-100 drop-shadow-[0_1px_8px_rgba(252,211,77,0.28)] translate-y-[2px]">
            Advent11Ale
          </span>
          <span className="hidden sm:block h-px w-8 bg-gradient-to-l from-transparent to-amber-300/60" aria-hidden />
        </h1>

        {/* Derecha: datos y año (escritorio) */}
        <div className="hidden sm:flex items-center justify-end gap-3 lg:gap-4 min-w-0">
          {giftsItem}
          {daysLabel && (
            <>
              <Dot />
              <span className="font-serif italic text-[17px] text-red-50/80 whitespace-nowrap">{daysLabel}</span>
            </>
          )}
          {showSelector ? (
            <>
              <span className="mx-1 h-5 w-px bg-amber-200/20" aria-hidden />
              <YearTabs year={year} years={years!} onChange={onYearChange!} />
            </>
          ) : (
            <>
              <Dot />
              <span className="font-serif text-[17px] font-semibold text-amber-100/90 tabular-nums">{year}</span>
            </>
          )}
        </div>

        {/* Derecha en móvil: año */}
        <div className="sm:hidden flex justify-end">
          {showSelector ? (
            <YearTabs year={year} years={years!} onChange={onYearChange!} />
          ) : (
            <span className="font-serif text-[15px] font-semibold text-amber-100/90">{year}</span>
          )}
        </div>
      </div>

      {/* Segunda línea en móvil: regalos y días */}
      <div className="sm:hidden flex items-center justify-center gap-3 pb-2 -mt-0.5">
        {giftsItem}
        {daysLabel && (
          <>
            <Dot />
            <span className="font-serif italic text-[15px] text-red-50/80">{daysLabel}</span>
          </>
        )}
      </div>

      {/* Doble filete dorado inferior */}
      <div className="absolute inset-x-0 bottom-0" aria-hidden>
        <div className="gold-divider" />
        <div className="mx-auto mt-[3px] h-px max-w-3xl bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />
      </div>
    </nav>
  )
})
