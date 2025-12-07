"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Heart } from "lucide-react"
import Snowfall from "@/components/snowfall"

interface Gift {
  id: number
  day: number
  dayName: string
  title: string
  description: string
  fullDescription: string
  image?: string
  color: string
}

interface OpenedGiftsPageProps {
  openedGifts: Set<number>
  gifts: Gift[]
  onBack: () => void
  onSelectGift: (giftId: number) => void
}

export function OpenedGiftsPage({ openedGifts, gifts, onBack, onSelectGift }: OpenedGiftsPageProps) {
  const openedGiftsList = gifts.filter(gift => openedGifts.has(gift.id))
    .sort((a, b) => a.day - b.day)

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Snowfall />
      <Navbar openedGiftsCount={openedGifts.size} totalGifts={gifts.length} />
      
      <div className="min-h-[calc(100vh-60px)] p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-amber-200 hover:text-amber-300 transition-colors text-sm sm:text-base self-start sm:self-auto"
              style={{ fontFamily: 'monospace' }}
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              Volver
            </button>
            
            <div className="text-center order-first sm:order-none">
              <h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                }}
              >
                Regalos Abiertos
              </h1>
              <p 
                className="text-amber-200 text-xs sm:text-sm lg:text-base"
                style={{ fontFamily: 'monospace' }}
              >
                {openedGiftsList.length} de {gifts.length} sorpresas
              </p>
            </div>
            
            <div className="w-20 hidden sm:block"></div> {/* Spacer para centrar */}
          </div>

          {/* Grid de regalos abiertos */}
          {openedGiftsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openedGiftsList.map((gift) => (
                <div
                  key={gift.id}
                  onClick={() => onSelectGift(gift.id)}
                  className="bg-red-900/80 border-3 border-amber-200/50 rounded-sm p-6 cursor-pointer hover:scale-105 transition-transform duration-300 group"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
                    imageRendering: 'pixelated'
                  }}
                >
                  {/* Imagen del regalo */}
                  <div className="relative aspect-square rounded-sm overflow-hidden mb-4 bg-gradient-to-br from-red-800 to-red-900">
                    {gift.image ? (
                      <img 
                        src={gift.image} 
                        alt={gift.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🎁
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Badge del día */}
                    <div className="absolute top-2 left-2 bg-amber-200 border-2 border-amber-400 rounded-sm px-3 py-1"
                      style={{
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.3)',
                        imageRendering: 'pixelated'
                      }}>
                      <span 
                        className="text-red-900 font-bold text-sm"
                        style={{ fontFamily: 'monospace' }}
                      >
                        Día {gift.day}
                      </span>
                    </div>
                  </div>

                  {/* Información del regalo */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 
                        className="text-xl lg:text-2xl font-bold text-white flex-1"
                        style={{ 
                          fontFamily: 'monospace',
                          textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                        }}
                      >
                        {gift.title}
                      </h2>
                      <Heart size={24} className="text-red-500 flex-shrink-0 fill-red-500" />
                    </div>
                    
                    <p 
                      className="text-amber-100 text-sm"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {gift.dayName}, {gift.day} de Diciembre
                    </p>
                    
                    <p 
                      className="text-white/90 text-base leading-relaxed line-clamp-2"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {gift.description}
                    </p>
                  </div>

                  {/* Indicador de click */}
                  <div className="mt-4 flex items-center justify-center text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontFamily: 'monospace' }}>
                    <span className="text-sm">Haz clic para ver detalles →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎁</div>
              <p 
                className="text-amber-200 text-xl font-semibold mb-2"
                style={{ fontFamily: 'monospace' }}
              >
                Aún no has abierto ningún regalo
              </p>
              <p 
                className="text-white/70 text-base"
                style={{ fontFamily: 'monospace' }}
              >
                Ve al árbol y selecciona un regalo disponible
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

