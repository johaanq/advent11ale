"use client"

import { useState } from "react"
import confetti from "canvas-confetti"

interface Gift {
  id: number
  day: number
  dayName: string
  color: string
  title: string
  message: string
}

interface GiftBoxProps {
  gift: Gift
  isOpened: boolean
  onClick: () => void
}

export default function GiftBox({ gift, isOpened, onClick }: GiftBoxProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (!isOpened && !isAnimating) {
      setIsAnimating(true)

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#991B1B", "#DC2626", "#FCD34D", "#FFFFFF"],
      })

      // Click delay for animation
      setTimeout(() => {
        setIsAnimating(false)
        onClick()
      }, 600)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={isAnimating || isOpened}
        className={`relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 group perspective transition-transform duration-300 transform hover:scale-105 ${
          isAnimating ? "animate-pulse" : ""
        } ${isOpened ? "opacity-60 cursor-default" : "cursor-pointer"}`}
      >
        {/* Gift Box */}
        <div
          className={`absolute inset-0 rounded-lg shadow-2xl transition-all duration-500 ${
            isAnimating ? "scale-y-0 origin-top" : "scale-y-100"
          } ${gift.color} bg-gradient-to-br`}
        >
          {/* Ribbon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-1/2 h-1 bg-yellow-300 rounded-full" />
            <div className="absolute h-1/2 w-1 bg-yellow-300 rounded-full" />
          </div>

          {/* Bow */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-300 rounded-full shadow-lg" />
        </div>

        {/* Gift Open Effect */}
        {isAnimating && (
          <>
            <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-red-400 to-red-600 rounded-tl-lg animate-bounce" />
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-red-500 to-red-700 rounded-tr-lg animate-bounce" />
          </>
        )}

        {/* Lock Icon - if not opened */}
        {!isOpened && !isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="text-white text-2xl sm:text-3xl lg:text-4xl">🎁</div>
          </div>
        )}

        {/* Opened state */}
        {isOpened && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-2xl sm:text-3xl lg:text-4xl">✨</div>
          </div>
        )}
      </button>

      {/* Day Label */}
      <div className="mt-3 text-center">
        <p className="text-wine-200 text-xs sm:text-sm font-semibold">{gift.dayName}</p>
        <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold">{gift.day}</p>
      </div>
    </div>
  )
}
