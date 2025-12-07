"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Heart } from "lucide-react"

interface GiftDetailPageProps {
  gift: any
  onBack: () => void
  openedGiftsCount?: number
  totalGifts?: number
}

export function GiftDetailPage({ gift, onBack, openedGiftsCount = 1, totalGifts = 4 }: GiftDetailPageProps) {
  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Navbar openedGiftsCount={openedGiftsCount} totalGifts={totalGifts} />

      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Botón para volver */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-600 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Volver al calendario</span>
            <span className="sm:hidden">Volver</span>
          </button>

          {/* Contenido del regalo */}
          <div className="bg-red-800/30 backdrop-blur-sm border-2 border-red-700 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {/* Imagen del regalo */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-red-800 to-red-900">
              <img src={gift.image || "/placeholder.svg"} alt={gift.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>

            {/* Información del regalo */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2 flex-1">
                  <p className="text-amber-500 uppercase text-xs sm:text-sm tracking-widest font-semibold">
                    {gift.dayName} {gift.day} de Diciembre
                  </p>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-balance">{gift.title}</h1>
                </div>
                <Heart size={24} className="sm:w-8 sm:h-8 text-red-500 flex-shrink-0 fill-red-500" />
              </div>

              <p className="text-red-100 text-sm sm:text-base lg:text-lg leading-relaxed">{gift.fullDescription}</p>

              <p className="text-red-200 text-xs sm:text-sm lg:text-base">{gift.description}</p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full sm:flex-1 border-red-300 text-red-100 hover:bg-red-800/50 bg-transparent text-sm sm:text-base"
              >
                Volver
              </Button>
              <Button className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-red-950 font-bold text-sm sm:text-base">
                Te amo ❤️
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
