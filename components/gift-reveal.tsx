"use client"

import { useState, useRef, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ChevronLeft } from "lucide-react"
import Snowfall from "@/components/snowfall"

interface GiftRevealProps {
  gift: any
  onBack: () => void
  onReveal: () => void
  openedGiftsCount?: number
  totalGifts?: number
}

export function GiftReveal({ 
  gift, 
  onBack, 
  onReveal,
  openedGiftsCount = 0,
  totalGifts = 4
}: GiftRevealProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef(0)

  const handleDragStart = (clientY: number) => {
    setIsDragging(true)
    startPosRef.current = clientY
  }

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return
    
    const diff = startPosRef.current - clientY
    // Solo permitir deslizar hacia arriba (diff positivo)
    if (diff > 0) {
      setDragOffset(Math.min(diff, 300))
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    
    // Si deslizó más del 50% (150px), revelar el regalo
    if (dragOffset > 150) {
      setIsRevealed(true)
      setTimeout(() => {
        onReveal()
      }, 800)
    } else {
      setDragOffset(0)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const handleMouseUp = () => handleDragEnd()
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY)
    const handleTouchEnd = () => handleDragEnd()

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragOffset])

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Snowfall />
      <Navbar openedGiftsCount={openedGiftsCount} totalGifts={totalGifts} />
      
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
          {/* Botón para volver */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-amber-200 hover:text-amber-300 transition-colors text-sm sm:text-base"
            style={{ fontFamily: 'monospace' }}
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Volver</span>
            <span className="sm:hidden">Volver</span>
          </button>

          {/* Contenedor del mensaje y deslizable */}
          <div 
            ref={containerRef}
            className="relative overflow-hidden rounded-sm min-h-[400px] sm:min-h-[500px] h-[70vh]"
          >
            {/* Vista previa del regalo detrás (Fondo) */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center z-0"
              style={{
                backgroundImage: gift.image ? `url(${gift.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Emoji removido o hecho más sutil para no tapar */}
              <p 
                className="relative z-10 text-white text-3xl sm:text-4xl lg:text-5xl font-bold opacity-0"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.8)'
                }}
          >
                🎁
              </p>
            </div>

            {/* Mensaje de Johan (Frente deslizable) */}
            <div 
              className={`absolute inset-0 bg-red-900/90 backdrop-blur-sm border-3 border-amber-200/50 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center transition-all duration-500 z-10 ${
                isRevealed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              style={{
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
                imageRendering: 'pixelated',
                transform: `translateY(-${dragOffset}px)`
              }}
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
            >
              <div className="text-center space-y-6 max-w-lg">
                {/* Fecha */}
                <p 
                  className="text-amber-400 uppercase text-xs sm:text-sm tracking-widest font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {gift.dayName} {gift.day} de Diciembre
                </p>

                {/* Título */}
                <h1 
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                  }}
                >
                  {gift.title}
                </h1>

                {/* Descripción/pista del regalo */}
                <p 
                  className="text-red-100 text-sm sm:text-base lg:text-lg leading-relaxed"
                  style={{ fontFamily: 'monospace' }}
                >
                  {gift.fullDescription}
                </p>

                {/* Nota especial */}
                {gift.specialNote && (
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-sm p-4 mt-6">
                    <p 
                      className="text-amber-900 text-xs sm:text-sm italic text-center"
                      style={{ fontFamily: 'monospace' }}
                    >
                      "{gift.specialNote}"
                    </p>
                  </div>
                )}

                {/* Indicador de deslizar */}
                <div className="mt-8 pt-8 border-t border-amber-400/30">
                  <div className="flex flex-col items-center gap-3">
                    <p 
                      className="text-amber-300 text-sm font-semibold"
                      style={{ fontFamily: 'monospace' }}
                    >
                      Desliza hacia arriba para ver tu regalo
                    </p>
                    <div className="animate-bounce">
                      <svg 
                        width="30" 
                        height="30" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        className="text-amber-400"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 15l7-7 7 7" 
                        />
                      </svg>
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

