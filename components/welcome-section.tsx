"use client"

import { useState, useEffect, useMemo, memo } from 'react'

interface Gift {
  id: number
  day: number
}

interface WelcomeSectionProps {
  openedGifts?: Set<number>
  gifts?: Gift[]
}

export const WelcomeSection = memo(function WelcomeSection({ openedGifts = new Set(), gifts = [] }: WelcomeSectionProps) {
  const birthdayDate = new Date(2025, 11, 11)
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1
  
  // Calcular qué regalos están disponibles (regalos del 8, 9, 10, 11 de diciembre)
  const availableGifts = [8, 9, 10, 11]
  const giftsAvailableToday = availableGifts.filter(day => day <= currentDay && currentMonth === 12)

  // Estado para las estrellas - inicializado como array vacío para evitar errores de hidratación
  const [stars, setStars] = useState<Array<{
    left: number
    top: number
    animationDuration: number
    animationDelay: number
  }>>([])

  // Generar valores aleatorios solo en el cliente después de la hidratación
  useEffect(() => {
    setStars(
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDuration: 2 + Math.random() * 2,
        animationDelay: Math.random() * 2
      }))
    )
  }, [])

  return (
    <div className="w-full lg:w-2/5 flex items-start justify-start p-3 sm:p-4 lg:p-5 relative overflow-hidden h-full" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      {/* Decoración de fondo - Estrellas navideñas */}
      <div className="absolute inset-0 opacity-20">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: '4px',
              height: '4px',
              backgroundColor: 'white',
              borderRadius: '50%',
              boxShadow: '0 0 6px white',
              animationDuration: `${star.animationDuration}s`,
              animationDelay: `${star.animationDelay}s`
            }}
          />
        ))}
      </div>

      {/* Decoración de ramas navideñas en las esquinas */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M20,80 Q30,60 40,70 Q50,80 60,70 Q70,60 80,70"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="35" cy="65" r="3" fill="white" />
          <circle cx="55" cy="65" r="3" fill="white" />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M20,80 Q30,60 40,70 Q50,80 60,70 Q70,60 80,70"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="35" cy="65" r="3" fill="white" />
          <circle cx="55" cy="65" r="3" fill="white" />
        </svg>
      </div>

      <div className="relative z-10 w-full py-3.5 h-full flex flex-col items-center justify-center">
        {/* Contenedor principal - Todo centrado */}
        <div className="w-full max-w-lg mx-auto space-y-4.5">
          {/* Título principal - Arriba centrado */}
          <div className="text-center space-y-2.5">
            <h1 
              className="text-3xl lg:text-4xl font-bold text-white leading-tight"
              style={{ 
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                textShadow: '2px 2px 0px rgba(0,0,0,0.4)',
                lineHeight: '1.2',
                imageRendering: 'pixelated'
              }}
            >
              CALENDARIO<br/>DE ADVIENTO
            </h1>
            
            {/* Separador decorativo */}
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <div className="h-px bg-white/30 flex-1" style={{ imageRendering: 'pixelated' }}></div>
              <span 
                className="text-xs text-white/70 font-medium px-2"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.4)',
                  imageRendering: 'pixelated'
                }}
              >
                4 SORPRESAS
              </span>
              <div className="h-px bg-white/30 flex-1" style={{ imageRendering: 'pixelated' }}></div>
            </div>
            
            {/* Mensaje personalizado - Solo texto con separador */}
            <p 
              className="text-white/85 text-sm lg:text-base font-medium leading-relaxed max-w-lg mx-auto px-4"
              style={{ 
                fontFamily: 'monospace',
                textShadow: '1px 1px 0px rgba(0,0,0,0.4)',
                lineHeight: '1.6',
                imageRendering: 'pixelated'
              }}
            >
              Mi amor, cada día hasta tu cumpleaños será una sorpresa especialmente diseñada para ti
            </p>
          </div>

          {/* Calendario Navideño - Centrado */}
          <div className="relative w-full max-w-sm mx-auto">
              {/* Contenedor unificado para imagen y calendario */}
              <div className="relative">
              {/* Imagen de Snoopy en la casa - más grande y pegada al calendario */}
              <div className="relative mb-0 flex justify-center">
                <img 
                  src="/snoopy_calendario.png" 
                  alt="Snoopy en su casa navideña" 
                  className="max-w-full h-auto"
                  style={{ 
                    maxHeight: '190px',
                    imageRendering: 'pixelated',
                    objectFit: 'contain',
                    marginBottom: '-2px' // Pegar visualmente al calendario
                  }}
                />
              </div>
              
              {/* Panel principal con 24 bolsillos - unido visualmente a la imagen */}
              <div 
                className="relative bg-red-600 rounded-b-sm rounded-t-none p-2"
                style={{ 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  imageRendering: 'pixelated',
                  borderTop: 'none'
                }}
              >
              {/* Grid de 5 filas x 7 columnas (31 días) */}
              <div className="grid grid-cols-7 gap-1.5">
                {useMemo(() => {
                  // Calcular días disponibles una sola vez (optimizado con Map)
                  const giftsMap = new Map(gifts.map(g => [g.day, g]))
                  const availableGiftDays = gifts
                    .filter(g => currentMonth === 12 && currentDay >= g.day)
                    .map(g => g.day)
                    .sort((a, b) => a - b)
                  
                  const firstAvailableDay = availableGiftDays.find(dayNum => {
                    const giftForDay = giftsMap.get(dayNum)
                    return giftForDay && !openedGifts.has(giftForDay.id)
                  })
                  
                  // Lista de íconos navideños (solo 4 días con regalos)
                  const christmasIcons = [
                    '🎅', '🎄', '☃️', '🦌'
                  ]
                  
                  // Generar rotaciones aleatorias para cada día (se mantienen consistentes) - Memoizado
                  const rotationCache = new Map<number, number>()
                  const generateRotation = (day: number) => {
                    if (rotationCache.has(day)) return rotationCache.get(day)!
                    const seed = day * 7 + 13
                    const random = ((seed * 9301 + 49297) % 233280) / 233280
                    const rotation = (random * 6 - 3)
                    const result = Math.abs(rotation) < 0.5 ? (rotation > 0 ? 1 : -1) : rotation
                    rotationCache.set(day, result)
                    return result
                  }
                  
                  // Generar rotaciones aleatorias para íconos (5-10 grados, izquierda o derecha) - Memoizado
                  const iconRotationCache = new Map<number, number>()
                  const generateIconRotation = (day: number) => {
                    if (iconRotationCache.has(day)) return iconRotationCache.get(day)!
                    const seed = day * 11 + 23
                    const random = ((seed * 9301 + 49297) % 233280) / 233280
                    const baseRotation = 5 + (random * 5)
                    const direction = random > 0.5 ? 1 : -1
                    const result = baseRotation * direction
                    iconRotationCache.set(day, result)
                    return result
                  }
                  
                  return Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const gift = giftsMap.get(day)
                    const isOpened = gift ? openedGifts.has(gift.id) : false
                    const hasGift = gift !== undefined
                    const isAvailable = currentMonth === 12 && currentDay >= day
                    const isGiftAvailable = hasGift && isAvailable
                    const isTodayAvailable = hasGift && firstAvailableDay === day && !isOpened
                    // Asignar un ícono diferente a cada día con regalo (días 8, 9, 10, 11)
                    // Día 8 = índice 0, Día 9 = índice 1, Día 10 = índice 2, Día 11 = índice 3
                    const iconIndex = hasGift && gift ? (gift.day - 8) : 0
                    const rotation = generateRotation(day)
                    const iconRotation = generateIconRotation(day)
                  
                  return (
                    <div 
                      key={day}
                      className={`relative ${hasGift && isGiftAvailable && !isOpened ? 'cursor-pointer' : ''}`}
                      style={{
                        filter: isOpened ? 'brightness(1.2)' : !isGiftAvailable && hasGift ? 'brightness(0.7)' : !hasGift ? 'brightness(0.8)' : 'brightness(1)',
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      {/* Bolsillo blanco simple - Estilo fiel a la imagen */}
                      <div 
                        className={`
                          relative aspect-square flex flex-col items-center justify-center
                          ${isOpened 
                            ? 'bg-yellow-50' 
                            : 'bg-white'
                          }
                        `}
                        style={{
                          borderRadius: '2px',
                          border: 'none',
                          boxShadow: isOpened 
                            ? '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.05)' 
                            : hasGift && isGiftAvailable
                            ? '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.05)'
                            : '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.05)',
                          imageRendering: 'pixelated',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Ícono navideño que cubre la fecha cuando está abierto */}
                        {isOpened ? (
                          <div 
                            className="absolute inset-0 flex items-center justify-center z-10" 
                            style={{ 
                              imageRendering: 'pixelated',
                              filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.6))',
                              fontSize: '2rem',
                              transform: `rotate(${iconRotation}deg)`,
                              transition: 'transform 0.2s ease'
                            }}>
                            {christmasIcons[iconIndex]}
                          </div>
                        ) : (
                          /* Número del día - Rojo grueso sobre fondo blanco */
                          <span 
                            className="font-bold relative z-10"
                            style={{ 
                              fontFamily: 'monospace',
                              fontWeight: '900',
                              fontSize: '1.1rem',
                              color: hasGift && isGiftAvailable
                                ? '#dc2626'
                                : '#991b1b',
                              textShadow: 'none',
                              imageRendering: 'pixelated',
                              letterSpacing: '0px',
                              lineHeight: '1'
                            }}
                          >
                            {day}
                          </span>
                        )}
                      </div>
                      
                      {/* Efecto sutil para el día disponible actual (solo si no está abierto) */}
                      {isTodayAvailable && !isOpened && (
                        <div className="absolute inset-0 bg-yellow-300/20 rounded-sm animate-pulse pointer-events-none" style={{ borderRadius: '2px' }} />
                      )}
                    </div>
                  )
                  })
                }, [gifts, openedGifts, currentMonth, currentDay])}
              </div>
              </div>
              </div>
          </div>

          {/* Información adicional - Abajo centrado, sin cards */}
          <div className="space-y-3 text-center">
            {/* Información en línea simple */}
            <div className="flex items-center justify-center gap-5 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-xs text-white/70 font-medium uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.4)',
                    imageRendering: 'pixelated'
                  }}
                >
                  SORPRESAS:
                </span>
                <span 
                  className="text-xl lg:text-2xl font-bold text-white"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                    imageRendering: 'pixelated'
                  }}
                >
                  4
                </span>
              </div>
              
              <div className="h-4 w-px bg-white/30" style={{ imageRendering: 'pixelated' }}></div>
              
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-xs text-white/70 font-medium uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.4)',
                    imageRendering: 'pixelated'
                  }}
                >
                  DICIEMBRE
                </span>
                <span 
                  className="text-xl lg:text-2xl font-bold text-white"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                    imageRendering: 'pixelated'
                  }}
                >
                  2025
                </span>
              </div>
            </div>

            {/* Separador sutil */}
            <div className="flex items-center justify-center max-w-xs mx-auto">
              <div className="h-px bg-white/20 flex-1" style={{ imageRendering: 'pixelated' }}></div>
            </div>

            {/* Mensaje especial */}
            <p 
              className="text-xs text-white/70 font-medium"
              style={{ 
                fontFamily: 'monospace',
                textShadow: '1px 1px 0px rgba(0,0,0,0.4)',
                imageRendering: 'pixelated'
              }}
            >
              Selecciona un regalo en el árbol para descubrirlo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
