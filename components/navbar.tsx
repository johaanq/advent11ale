"use client"

import { useState, useEffect, memo } from "react"

interface NavbarProps {
  openedGiftsCount?: number
  totalGifts?: number
  onShowOpenedGifts?: () => void
}

export const Navbar = memo(function Navbar({ openedGiftsCount = 0, totalGifts = 4, onShowOpenedGifts }: NavbarProps) {
  const [currentDate, setCurrentDate] = useState("")
  const [daysUntilBirthday, setDaysUntilBirthday] = useState(0)

  useEffect(() => {
    const updateDate = () => {
      const today = new Date()
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
      }
      const formattedDate = today.toLocaleDateString('es-ES', options)
      setCurrentDate(formattedDate)

      // Calcular días hasta cumpleaños
      const birthdayDate = new Date(2025, 11, 11) // 11 de diciembre (mes 11 = diciembre)
      const days = Math.ceil((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      setDaysUntilBirthday(days > 0 ? days : 0)
    }

    updateDate()
    const interval = setInterval(updateDate, 1000 * 60 * 60) // Actualizar cada hora
    return () => clearInterval(interval)
  }, [])

  return (
    <nav 
      className="w-full px-4 py-3 z-50 relative border-b border-white/30"
      style={{ 
        backgroundColor: 'lab(20 46.5 22.89 / 1)'
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-0">
        {/* Lado izquierdo */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 border-r-0 sm:border-r border-white/30 pr-0 sm:pr-4 lg:pr-6 w-full sm:w-auto justify-between sm:justify-start">
          {/* Fecha de hoy - Ocultar en móvil muy pequeño */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span 
              className="text-red-100 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: 'monospace' }}
            >
              <span className="hidden sm:inline">{currentDate}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </span>
          </div>

          {/* Regalos abiertos - Clickable */}
          <div 
            className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onShowOpenedGifts?.()}
          >
            <span 
              className="text-red-100 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wide hidden sm:inline"
              style={{ fontFamily: 'monospace' }}
            >
              REGALOS
            </span>
            <span 
              className="text-white text-xs sm:text-sm font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              {openedGiftsCount}/{totalGifts}
            </span>
            <span className="text-red-100 text-xs hidden sm:inline">→</span>
          </div>

          {/* Días restantes */}
          <div className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <span 
              className="text-red-100 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-wide hidden sm:inline"
              style={{ fontFamily: 'monospace' }}
            >
              DÍAS
            </span>
            <span 
              className="text-white text-xs sm:text-sm font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              {daysUntilBirthday}
            </span>
            <span className="text-red-100 text-xs hidden sm:inline">→</span>
          </div>
        </div>

        {/* Centro - Logo */}
        <div className="flex-1 flex justify-center border-r-0 sm:border-r border-white/30 pr-0 sm:pr-4 lg:pr-6 w-full sm:w-auto order-first sm:order-none">
          <h1 
            className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-wider"
            style={{ 
              fontFamily: 'monospace',
              textShadow: '2px 2px 0px rgba(0,0,0,0.3), 4px 4px 0px rgba(0,0,0,0.2)',
              letterSpacing: '0.1em'
            }}
          >
            Advent11Ale
          </h1>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 pl-0 sm:pl-4 lg:pl-6 w-full sm:w-auto justify-end">
          {/* Año */}
          <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            <span 
              className="text-red-100 text-xs sm:text-sm font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              2025
            </span>
            <span className="text-red-100 text-xs hidden sm:inline">▼</span>
          </div>

          {/* Idioma */}
          <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            <span 
              className="text-red-100 text-xs sm:text-sm font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              ES
            </span>
            <span className="text-red-100 text-xs hidden sm:inline">▼</span>
          </div>
        </div>
      </div>
    </nav>
  )
})

