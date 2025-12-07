"use client"

import { useState } from "react"
import GiftBox from "./gift-box"
import ChristmasTree from "./christmas-tree"
import Snowfall from "./snowfall"

interface Gift {
  id: number
  day: number
  dayName: string
  color: string
  title: string
  message: string
}

interface AdventCalendarProps {
  gifts: Gift[]
  onSelectGift: (gift: Gift) => void
}

export default function AdventCalendar({ gifts, onSelectGift }: AdventCalendarProps) {
  const [openedGifts, setOpenedGifts] = useState(new Set())

  const handleGiftClick = (gift: Gift) => {
    setOpenedGifts((prev) => new Set([...prev, gift.id]))
    onSelectGift(gift)
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <Snowfall />

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16 z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 text-balance">Adviento Especial</h1>
        <p className="text-wine-200 text-lg sm:text-xl">Descubre 4 sorpresas para tu cumpleaños navideño</p>
      </div>

      {/* Christmas Tree */}
      <div className="mb-8 sm:mb-12 z-10">
        <ChristmasTree />
      </div>

      {/* Gift Boxes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full max-w-6xl">
        {gifts.map((gift) => (
          <GiftBox
            key={gift.id}
            gift={gift}
            isOpened={openedGifts.has(gift.id)}
            onClick={() => handleGiftClick(gift)}
          />
        ))}
      </div>

      {/* Bottom Decoration */}
      <div className="mt-12 sm:mt-16 text-center text-wine-300 text-sm">
        <p>✨ Cada día una sorpresa especial ✨</p>
      </div>
    </div>
  )
}
