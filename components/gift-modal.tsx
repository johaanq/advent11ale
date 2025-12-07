"use client"

import { useEffect } from "react"

interface Gift {
  id: number
  day: number
  dayName: string
  color: string
  title: string
  message: string
  description: string
  image?: string
}

interface GiftModalProps {
  gift: Gift
  onClose: () => void
}

export default function GiftModal({ gift, onClose }: GiftModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-wine-900 to-wine-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-wine-700 animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${gift.color} bg-gradient-to-r p-6 sm:p-8 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:scale-110 transition-transform text-2xl"
          >
            ✕
          </button>
          <h2 className="text-3xl sm:text-4xl font-bold pr-8">{gift.title}</h2>
          <p className="text-red-100 mt-2 text-sm sm:text-base">
            {gift.dayName}, {gift.day} de Diciembre
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Image */}
          <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-6 shadow-lg">
            <img src={gift.image || "/placeholder.svg"} alt={gift.title} className="w-full h-full object-cover" />
          </div>

          {/* Description */}
          <p className="text-wine-100 text-base sm:text-lg leading-relaxed mb-6">{gift.description}</p>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              onClick={onClose}
              className="flex-1 bg-wine-700 hover:bg-wine-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Volver al Adviento
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-wine-900 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ¡Me encanta! ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
