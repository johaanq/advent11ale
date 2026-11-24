"use client"

import { Navbar } from "@/components/navbar"
import { ChevronLeft, Heart, ArrowRight } from "lucide-react"
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
  const openedGiftsList = gifts.filter((gift) => openedGifts.has(gift.id)).sort((a, b) => a.day - b.day)

  return (
    <div className="min-h-screen overflow-hidden bg-wine-gradient animate-page-in">
      <Snowfall />
      <Navbar openedGiftsCount={openedGifts.size} totalGifts={gifts.length} />

      <div className="min-h-[calc(100vh-60px)] p-3 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 -ml-3 text-amber-200 hover:text-amber-100 hover:bg-white/5 transition-colors text-sm sm:text-base self-start sm:self-auto"
            >
              <ChevronLeft size={18} />
              Volver
            </button>

            <div className="text-center order-first sm:order-none">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-2 text-gold-glow">
                Regalos Abiertos
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div className="gold-divider w-10" />
                <p className="text-amber-200 text-xs sm:text-sm lg:text-base">
                  {openedGiftsList.length} de {gifts.length} sorpresas
                </p>
                <div className="gold-divider w-10" />
              </div>
            </div>

            <div className="w-20 hidden sm:block" />
          </div>

          {openedGiftsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {openedGiftsList.map((gift, i) => (
                <button
                  type="button"
                  key={gift.id}
                  onClick={() => onSelectGift(gift.id)}
                  className="group text-left rounded-xl p-4 sm:p-5 border border-amber-200/20 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(252,211,77,0.15),0_0_30px_-5px_rgba(252,211,77,0.25)] focus-visible:outline-2 focus-visible:outline-amber-300 animate-slide-up"
                  style={{
                    background: "linear-gradient(170deg, rgba(127,29,29,0.85) 0%, rgba(69,10,10,0.9) 100%)",
                    boxShadow: "0 14px 30px -15px rgba(0,0,0,0.7)",
                    animationDelay: `${i * 90}ms`,
                  }}
                >
                  {/* Imagen */}
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-red-800 to-red-900">
                    {gift.image ? (
                      <img
                        src={gift.image}
                        alt={gift.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    {/* Cinta con el día */}
                    <div
                      className="absolute top-3 left-0 pl-3 pr-4 py-1 font-mono text-sm font-extrabold text-red-900"
                      style={{
                        background: "linear-gradient(180deg, #fde68a, #f59e0b)",
                        clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                      }}
                    >
                      Día {gift.day}
                    </div>
                  </div>

                  {/* Información */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-xl lg:text-2xl font-semibold text-white flex-1 text-shadow-pixel">
                        {gift.title}
                      </h2>
                      <Heart size={22} className="text-red-500 flex-shrink-0 fill-red-500 mt-1 transition-transform group-hover:scale-110" />
                    </div>

                    <p className="text-amber-200/80 text-xs sm:text-sm uppercase tracking-wider">
                      {gift.dayName}, {gift.day} de Diciembre
                    </p>

                    <p className="text-white/85 text-sm sm:text-base leading-relaxed line-clamp-2">{gift.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-1.5 text-amber-200/70 text-sm transition-colors group-hover:text-amber-200">
                    Ver detalles
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-slide-up">
              <img
                src="/snoopy_calendario.png"
                alt=""
                className="mx-auto mb-6 h-36 w-auto opacity-90 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="font-display text-amber-200 text-xl sm:text-2xl font-semibold mb-2">
                Aún no has abierto ningún regalo
              </p>
              <p className="text-white/70 text-sm sm:text-base">Ve al árbol y selecciona un regalo disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
